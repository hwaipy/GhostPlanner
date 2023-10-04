import json
import os
import threading
from datetime import datetime
import pytz
from tornado import web, ioloop
from threading import Thread

# Auth not inlcluded
# Database not included

tz = pytz.timezone('Asia/Shanghai')


class WhatsNextServerHTTP:
    def __init__(self, wnserver, port) -> None:
        self.wnserver = wnserver
        self.port = port

        handlers_array = [
            (r'/s/(.+?)', WNSHandler, {'wnserver': self.wnserver}),
        ]
        settings = {
            'debug': True,
        }
        app = web.Application(handlers_array, **settings)
        app.listen(port)
        Thread(target=ioloop.IOLoop.instance().start).start()


class WNSHandler(web.RequestHandler):
    def __init__(self, *args, wnserver):
        super().__init__(*args)
        self.wnserver = wnserver

    def get(self, func):
        self.set_header("Access-Control-Allow-Origin", "*")
        if func == 'GetActions':
            after = self.get_arguments('after') + [0]
            after = int(after[0])
            actions = self.wnserver.get_actions('hwaipy', after)
            self.set_status(200)
            self.write(actions)
        else:
            raise web.HTTPError(404)


class WhatsNextServer:
    def __init__(self, store_root) -> None:
        self.__store_root = store_root
        self.actionsets = {}

    def __get_action_set(self, name):
        if name not in self.actionsets:
            self.actionsets[name] = ActionSet(f'{self.__store_root}/{name}.as')
        return self.actionsets[name]

    def get_actions(self, name, after):
        action_set = self.__get_action_set(name)
        return action_set.get_actions(after)

    def test(self):
        print(self.__get_action_set('testname'))


class ActionSet:
    def __init__(self, store) -> None:
        self.status_id = 0
        self.actions = []
        self.__lock = threading.Lock()
        self.__filename = store
        self.__load()

    def __load(self):
        if not os.path.exists(self.__filename):
            with open(self.__filename, 'w', encoding='UTF-8'):
                pass
        with open(self.__filename, 'r', encoding='UTF-8') as file:
            lines = file.readlines()
            for line in lines:
                content = json.loads(line)
                self.actions.append(
                    [content['id'], content['time'], content['action'], line.strip()])
                self.status_id = max(self.status_id, content['id'])

    def __save(self):
        content = '\n'.join([action[3] for action in self.actions])
        with open(self.__filename, 'w', encoding='UTF-8') as file:
            file.write(content)

    def append(self, status_id, action):
        try:
            self.__lock.acquire()
            if self.status_id != status_id:
                return self.status_id
            action_time = datetime.now(tz)
            self.status_id += 1
            ser = json.dumps(
                {'id': self.status_id, 'time': str(action_time), 'action': action})
            self.actions.append(
                [self.status_id, action_time.timestamp(), action, ser])
            self.__save()
        finally:
            self.__lock.release()

    def get_actions(self, after):
        valid_actions = [a[3] for a in self.actions if a[0] > after]
        return '[' + ', '.join(valid_actions) + ']'


if __name__ == '__main__':
    # action_set = ActionSet(f'.db/hwaipy.as')
    # action_set.append(action_set.status_id, {'a': 3})

    port = 8000
    wnserver = WhatsNextServer('.db')
    wnserver_http = WhatsNextServerHTTP(wnserver, port)
    print(f"What's Next server started at :{port}.")
