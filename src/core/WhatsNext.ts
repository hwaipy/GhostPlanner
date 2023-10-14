import wnserver from './Server';
import { ref } from 'vue';

class WhatsNext {
  status_id = 0;
  actions = [];
  task_model: any = ref({
    label: -1,
    title: '',
    children: [],
    parent: null,
  });
  tasks: any = {};

  async init() {
    this.status_id = 0;
    this.actions = [];
    this.task_model.value.children.splice(0, this.task_model.value.children.length);
    this.tasks = {};

    const actions = await wnserver.get_new_actions(-1);
    for (const i in actions) {
      const action = actions[i];
      this.new_action(action.id, action.action);
    }
  }

  new_action(id: number, action: any) {
    switch (action.Type) {
      case 'CreateTask':
        const task = {
          label: id,
          title: action.Title,
          isProject: action.IsProject,
          children: [],
          parent: action.Parent ? this.tasks[action.Parent] : null,
          set_property: (key: string, value: any) => this.set_property(id, key, value),
        };
        const parentChildrenList = task.parent ? this.tasks[action.Parent].children : this.task_model.value.children;
        parentChildrenList.push(task);
        this.tasks[id] = parentChildrenList[parentChildrenList.length - 1];
        break;
      case 'ModifyTask':
        const modifiedTask = this.tasks[action.Task];
        console.log('M');

        // if (action.Property === 'Children') {
        //   const parentChildrenList = modifiedTask.parent ? modifiedTask.parent.children : this.task_model.value;
        //   const iInParent = parentChildrenList.indexOf(this.tasks[action.NewValue[i]]);

        //   modifiedTask.children.splice(0, modifiedTask.children.length);
        //   for (const i in action.NewValue) {
        //     modifiedTask.children.push(this.tasks[action.NewValue[i]]);

        //     const iInRoot = this.task_model.value.indexOf(this.tasks[action.NewValue[i]]);
        //     if (iInRoot >= 0) {
        //       this.task_model.value.splice(iInRoot, 1);
        //     }
        //   }
        // }
        break;
      default:
        console.log('Unknown action type: ' + action.Type);
    }
  }

  get_task_node(id: number) {
    if (id == null) return this.task_model.value;
    return this.tasks[id];
  }

  set_property(id: number, key: string, value: any) {
    console.log('setttingggg... ' + id + '   ' + key + '    ' + value);
    const action = { id: 10, time: '2023-09-29 17:10:21.563623+08:00', action: { Type: 'CreateTask', Title: '原理验证', IsProject: true, Parent: 9 } };

    console.log(action);

    // this.actions.push(action);
    // this.new_action(action.id, action.action);
  }
}

const wn = new WhatsNext();

export default wn;
