{"id": 0, "time": "2023-09-29 17:10:20.563623+08:00", "action": {"Type": "CreateTask", "Title": "Thinking", "IsProject": true}}
{"id": 1, "time": "2023-09-29 17:10:21.563623+08:00", "action": {"Type": "CreateTask", "Title": "IF", "IsProject": true}}
{"id": 2, "time": "2023-09-29 17:10:21.563623+08:00", "action": {"Type": "CreateTask", "Title": "Feature", "IsProject": false}}
{"id": 3, "time": "2023-09-29 17:10:21.563623+08:00", "action": {"Type": "ModifyTask", "Task": 1, "Property": "Children", "OldValue": [], "NewValue": [2]}}
{"id": 4, "time": "2023-09-29 17:10:21.563623+08:00", "action": {"Type": "CreateTask", "Title": "尝试完成 rust 版本 broker 和 worker"}}
{"id": 5, "time": "2023-09-29 17:10:21.563623+08:00", "action": {"Type": "ModifyTask", "Task": 2, "Property": "Children", "OldValue": [], "NewValue": [4]}}
{"id": 6, "time": "2023-09-29 17:10:21.563623+08:00", "action": {"Type": "CreateTask", "Title": "完成reconnectable socket"}}
{"id": 7, "time": "2023-09-29 17:10:21.563623+08:00", "action": {"Type": "ModifyTask", "Task": 2, "Property": "Children", "OldValue": [4], "NewValue": [4, 6]}}