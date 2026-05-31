import hashlib
import hmac
import json
import logging
import os
import secrets
import sqlite3
import threading
import time
from datetime import datetime

import pytz
from tornado import web, ioloop
from threading import Thread

tz = pytz.timezone('Asia/Shanghai')

TOKEN_TTL = 30 * 24 * 3600  # 30 days


class Auth:
    """Single-user credential store with stateless HMAC bearer tokens.

    The password is set on first use from the app (trust-on-first-use), so it is
    never embedded in code or seen by anyone but the user. Config lives in
    auth.json next to the DB (gitignored)."""

    def __init__(self, path):
        self.path = path
        self.cfg = self._load()

    def _load(self):
        if os.path.exists(self.path):
            with open(self.path, encoding='UTF-8') as f:
                return json.load(f)
        cfg = {'secret': secrets.token_hex(32), 'user': None, 'salt': None, 'pwhash': None}
        self._save(cfg)
        return cfg

    def _save(self, cfg):
        with open(self.path, 'w', encoding='UTF-8') as f:
            json.dump(cfg, f)
        os.chmod(self.path, 0o600)

    @property
    def configured(self):
        return bool(self.cfg.get('pwhash'))

    def _hash(self, password, salt):
        return hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 200000).hex()

    def set_password(self, user, password):
        if self.configured:
            return False
        salt = secrets.token_hex(16)
        self.cfg.update({'user': user, 'salt': salt, 'pwhash': self._hash(password, salt)})
        self._save(self.cfg)
        return True

    def verify_password(self, user, password):
        if not self.configured or user != self.cfg['user']:
            return False
        expected = self.cfg['pwhash']
        return hmac.compare_digest(expected, self._hash(password, self.cfg['salt']))

    def make_token(self, user):
        exp = int(time.time()) + TOKEN_TTL
        sig = hmac.new(self.cfg['secret'].encode(), f'{user}.{exp}'.encode(), hashlib.sha256).hexdigest()
        return f'{user}.{exp}.{sig}'

    def verify_token(self, token):
        try:
            user, exp, sig = token.rsplit('.', 2)
            if int(exp) < time.time():
                return False
            good = hmac.new(self.cfg['secret'].encode(), f'{user}.{exp}'.encode(), hashlib.sha256).hexdigest()
            return hmac.compare_digest(good, sig)
        except Exception:
            return False


class SPAStaticHandler(web.StaticFileHandler):
    """Static handler that forbids caching of the entry points so a redeploy is
    picked up immediately. Without this the browser heuristically caches sw.js and
    never detects a new service worker, leaving clients stuck on the old shell.
    Content-hashed files under /assets/ stay cacheable."""

    def set_extra_headers(self, path):
        revalidate = (
            path == ''
            or path.endswith('.html')
            or path.endswith('sw.js')
            or path.endswith('manifest.json')
            or path.startswith('workbox-')
        )
        if revalidate:
            self.set_header('Cache-Control', 'no-cache, no-store, must-revalidate')


class WhatsNextServerHTTP:
    def __init__(self, wnserver, port, static_dir=None, auth=None) -> None:
        self.wnserver = wnserver
        self.port = port

        handlers_array = [
            (r'/s/(.+?)', WNSHandler, {'wnserver': self.wnserver, 'auth': auth}),
        ]
        # Serve the built PWA (dist/pwa) on the same port so the frontend and the
        # sync API share one origin. Router uses hash mode, so no SPA fallback needed.
        if static_dir and os.path.isdir(static_dir):
            handlers_array.append(
                (r'/(.*)', SPAStaticHandler, {'path': static_dir, 'default_filename': 'index.html'})
            )
        settings = {
            'debug': False,
        }
        app = web.Application(handlers_array, **settings)
        app.listen(port)
        Thread(target=ioloop.IOLoop.instance().start).start()


class WNSHandler(web.RequestHandler):
    def __init__(self, *args, wnserver, auth=None):
        super().__init__(*args)
        self.wnserver = wnserver
        self.auth = auth

    def set_default_headers(self):
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.set_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def options(self, func):
        self.set_status(204)
        self.finish()

    def _write_json(self, obj, status=200):
        self.set_header('Content-Type', 'application/json')
        self.set_status(status)
        self.write(json.dumps(obj))

    def _authed(self):
        if self.auth is None:
            return True
        header = self.request.headers.get('Authorization', '')
        token = header[7:] if header.startswith('Bearer ') else ''
        return self.auth.verify_token(token)

    def get(self, func):
        if func == 'AuthStatus':
            self._write_json({'configured': self.auth.configured if self.auth else False})
        else:
            raise web.HTTPError(404)

    def post(self, func):
        if func == 'Login':
            body = json.loads(self.request.body or b'{}')
            if self.auth and self.auth.verify_password(body.get('user', ''), body.get('password', '')):
                self._write_json({'token': self.auth.make_token(body['user'])})
            else:
                self._write_json({'error': 'Invalid credentials'}, status=401)
            return
        if func == 'SetPassword':
            body = json.loads(self.request.body or b'{}')
            if not self.auth or self.auth.configured:
                self._write_json({'error': 'Already configured'}, status=403)
                return
            user = (body.get('user') or '').strip()
            password = body.get('password') or ''
            if not user or len(password) < 4:
                self._write_json({'error': 'Username required and password must be at least 4 characters'}, status=400)
                return
            self.auth.set_password(user, password)
            self._write_json({'token': self.auth.make_token(user)})
            return
        if func == 'Sync':
            if not self._authed():
                self._write_json({'error': 'Unauthorized'}, status=401)
                return
            body = json.loads(self.request.body or b'{}')
            name = body.get('name', 'default')
            after = int(body.get('after', 0))
            incoming = body.get('actions', [])
            actions = self.wnserver.sync(name, after, incoming)
            self._write_json({'actions': actions})
            return
        raise web.HTTPError(404)


class WhatsNextServer:
    def __init__(self, store_root) -> None:
        self.__store_root = store_root
        self.__lock = threading.Lock()
        self.__db_path = os.path.join(store_root, 'ghostplanner.sqlite3')
        os.makedirs(store_root, exist_ok=True)
        self.__init_db()
        self.__migrate_legacy()

    def __connect(self):
        conn = sqlite3.connect(self.__db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def __init_db(self):
        with self.__connect() as conn:
            conn.execute(
                '''CREATE TABLE IF NOT EXISTS actions (
                    name TEXT NOT NULL,
                    seq  INTEGER NOT NULL,
                    uid  TEXT NOT NULL,
                    ts   TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    PRIMARY KEY (name, seq),
                    UNIQUE (name, uid)
                )'''
            )

    def sync(self, name, after, incoming):
        with self.__lock:
            with self.__connect() as conn:
                for rec in incoming:
                    self.__insert(conn, name, rec)
                rows = conn.execute(
                    'SELECT uid, seq, ts, payload FROM actions WHERE name=? AND seq>? ORDER BY seq',
                    (name, after),
                ).fetchall()
        return [
            {'uid': r['uid'], 'seq': r['seq'], 'ts': r['ts'], 'action': json.loads(r['payload'])}
            for r in rows
        ]

    def __insert(self, conn, name, rec):
        uid = rec['uid']
        exists = conn.execute(
            'SELECT 1 FROM actions WHERE name=? AND uid=?', (name, uid)
        ).fetchone()
        if exists:
            return
        next_seq = conn.execute(
            'SELECT COALESCE(MAX(seq), 0) + 1 FROM actions WHERE name=?', (name,)
        ).fetchone()[0]
        ts = rec.get('ts') or str(datetime.now(tz))
        conn.execute(
            'INSERT INTO actions (name, seq, uid, ts, payload) VALUES (?, ?, ?, ?, ?)',
            (name, next_seq, uid, ts, json.dumps(rec['action'])),
        )

    def __migrate_legacy(self):
        """One-time import of legacy JSONL .as logs (int ids) into SQLite (UUID ids)."""
        for fname in os.listdir(self.__store_root):
            if not fname.endswith('.as'):
                continue
            name = fname[:-3]
            with self.__connect() as conn:
                has_rows = conn.execute(
                    'SELECT 1 FROM actions WHERE name=? LIMIT 1', (name,)
                ).fetchone()
                if has_rows:
                    continue
                self.__import_legacy_file(conn, name, os.path.join(self.__store_root, fname))

    def __import_legacy_file(self, conn, name, path):
        import uuid
        id_map = {}
        records = []
        with open(path, 'r', encoding='UTF-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                old = json.loads(line)
                action = dict(old['action'])
                new_uid = str(uuid.uuid4())
                if action['type'] == 'CreateTask':
                    id_map[old['id']] = new_uid
                    if action.get('parent') is not None:
                        action['parent'] = id_map.get(action['parent'])
                elif action['type'] == 'ModifyTask':
                    action['task'] = id_map.get(action['task'])
                records.append({'uid': new_uid, 'ts': old.get('time'), 'action': action})
        for rec in records:
            self.__insert(conn, name, rec)
        print(f"Migrated {len(records)} legacy actions for '{name}'.")


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
    logging.getLogger('tornado.access').setLevel(logging.INFO)
    port = 8002
    base = os.path.dirname(os.path.abspath(__file__))
    store_root = os.path.join(base, '..', '.db')
    static_dir = os.path.join(base, '..', 'dist', 'pwa')
    wnserver = WhatsNextServer(store_root)
    auth = Auth(os.path.join(store_root, 'auth.json'))
    wnserver_http = WhatsNextServerHTTP(wnserver, port, static_dir, auth)
    print(f"What's Next server started at :{port} (auth configured: {auth.configured}).")
    while True:
        try:
            __import__('time').sleep(3600)
        except KeyboardInterrupt:
            break
