"""Unit tests for the GhostPlanner sync server (SQLite store + Sync protocol).

Run:  python3 -m unittest discover -s server -p 'test_*.py'
Hermetic: every test uses a fresh temp directory; no network, no shared state.
"""
import json
import os
import tempfile
import unittest
import uuid

from server import WhatsNextServer, Auth


def make_action(payload, ts='2026-01-01T00:00:00Z', action_uid=None):
    return {'uid': action_uid or str(uuid.uuid4()), 'ts': ts, 'action': payload}


class SyncServerTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.srv = WhatsNextServer(self.tmp)

    def test_push_assigns_monotonic_seq(self):
        a1 = make_action({'type': 'CreateTask', 'title': 'A', 'isProject': True, 'parent': None})
        a2 = make_action({'type': 'CreateTask', 'title': 'B', 'isProject': False, 'parent': None})
        out = self.srv.sync('u', 0, [a1, a2])
        self.assertEqual([r['seq'] for r in out], [1, 2])
        self.assertEqual([r['action']['title'] for r in out], ['A', 'B'])

    def test_pull_returns_only_after(self):
        actions = [make_action({'type': 'CreateTask', 'title': str(i), 'isProject': False, 'parent': None}) for i in range(3)]
        self.srv.sync('u', 0, actions)
        out = self.srv.sync('u', 2, [])  # only seq > 2
        self.assertEqual([r['seq'] for r in out], [3])

    def test_idempotent_duplicate_uid(self):
        a1 = make_action({'type': 'CreateTask', 'title': 'once', 'isProject': True, 'parent': None}, action_uid='dup')
        self.srv.sync('u', 0, [a1])
        # Re-push the same uid (e.g. a retried request): must not duplicate.
        dup = make_action({'type': 'CreateTask', 'title': 'CHANGED', 'isProject': True, 'parent': None}, action_uid='dup')
        out = self.srv.sync('u', 0, [dup])
        self.assertEqual(len(out), 1)
        self.assertEqual(out[0]['seq'], 1)
        self.assertEqual(out[0]['action']['title'], 'once')  # original kept

    def test_namespaces_are_isolated(self):
        self.srv.sync('alice', 0, [make_action({'type': 'CreateTask', 'title': 'A', 'isProject': True, 'parent': None})])
        self.assertEqual(len(self.srv.sync('bob', 0, [])), 0)

    def test_pull_is_ordered_by_seq(self):
        actions = [make_action({'type': 'CreateTask', 'title': str(i), 'isProject': False, 'parent': None}) for i in range(5)]
        self.srv.sync('u', 0, actions)
        out = self.srv.sync('u', 0, [])
        self.assertEqual([r['seq'] for r in out], [1, 2, 3, 4, 5])


class LegacyMigrationTest(unittest.TestCase):
    def test_migrates_int_ids_to_uuid_preserving_tree(self):
        tmp = tempfile.mkdtemp()
        legacy = [
            {'id': 0, 'time': 't', 'action': {'type': 'CreateTask', 'title': 'Root', 'isProject': True, 'parent': None}},
            {'id': 1, 'time': 't', 'action': {'type': 'CreateTask', 'title': 'Child', 'isProject': False, 'parent': 0}},
            {'id': 2, 'time': 't', 'action': {'type': 'ModifyTask', 'task': 1, 'property': 'flagged', 'oldValue': False, 'newValue': True}},
        ]
        with open(os.path.join(tmp, 'proj.as'), 'w', encoding='UTF-8') as f:
            for row in legacy:
                f.write(json.dumps(row) + '\n')

        srv = WhatsNextServer(tmp)  # migration runs on init
        out = srv.sync('proj', 0, [])
        self.assertEqual(len(out), 3)

        # All ids must now be UUIDs (not the old ints), and references must resolve.
        title_by_uid = {r['uid']: r['action']['title'] for r in out if r['action']['type'] == 'CreateTask'}
        creates = {r['action']['title']: r for r in out if r['action']['type'] == 'CreateTask'}
        modify = next(r for r in out if r['action']['type'] == 'ModifyTask')

        self.assertEqual(title_by_uid[creates['Child']['action']['parent']], 'Root')
        self.assertEqual(title_by_uid[modify['action']['task']], 'Child')
        self.assertEqual(modify['action']['newValue'], True)

    def test_migration_runs_once(self):
        tmp = tempfile.mkdtemp()
        with open(os.path.join(tmp, 'proj.as'), 'w', encoding='UTF-8') as f:
            f.write(json.dumps({'id': 0, 'time': 't', 'action': {'type': 'CreateTask', 'title': 'A', 'isProject': True, 'parent': None}}) + '\n')
        WhatsNextServer(tmp)
        srv2 = WhatsNextServer(tmp)  # second init must NOT re-import (table already populated)
        self.assertEqual(len(srv2.sync('proj', 0, [])), 1)


class AuthTest(unittest.TestCase):
    def setUp(self):
        self.path = os.path.join(tempfile.mkdtemp(), 'auth.json')
        self.auth = Auth(self.path)

    def test_unconfigured_then_set_once(self):
        self.assertFalse(self.auth.configured)
        self.assertTrue(self.auth.set_password('hwaipy', 'secret123'))
        self.assertTrue(self.auth.configured)
        # cannot overwrite once configured (TOFU)
        self.assertFalse(self.auth.set_password('someone', 'else'))

    def test_verify_password(self):
        self.auth.set_password('hwaipy', 'secret123')
        self.assertTrue(self.auth.verify_password('hwaipy', 'secret123'))
        self.assertFalse(self.auth.verify_password('hwaipy', 'wrong'))
        self.assertFalse(self.auth.verify_password('other', 'secret123'))

    def test_token_roundtrip_and_tamper(self):
        self.auth.set_password('hwaipy', 'secret123')
        tok = self.auth.make_token('hwaipy')
        self.assertTrue(self.auth.verify_token(tok))
        self.assertFalse(self.auth.verify_token(tok + 'x'))
        self.assertFalse(self.auth.verify_token('garbage'))
        self.assertFalse(self.auth.verify_token(''))

    def test_expired_token_rejected(self):
        import hmac as _h, hashlib as _hl
        self.auth.set_password('hwaipy', 'secret123')
        exp = 1  # far in the past
        sig = _h.new(self.auth.cfg['secret'].encode(), f'hwaipy.{exp}'.encode(), _hl.sha256).hexdigest()
        self.assertFalse(self.auth.verify_token(f'hwaipy.{exp}.{sig}'))

    def test_secret_persists_across_instances(self):
        self.auth.set_password('hwaipy', 'secret123')
        tok = self.auth.make_token('hwaipy')
        reloaded = Auth(self.path)  # new process simulation
        self.assertTrue(reloaded.verify_token(tok))


if __name__ == '__main__':
    unittest.main()
