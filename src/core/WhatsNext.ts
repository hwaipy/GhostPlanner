import wnserver from './Server';
import { ref } from 'vue';

class WhatsNext {
  status_id = 0;
  actions = [];
  task_model: any = ref({
    label: -1,
    title: 'root',
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
    // setInterval(() => {
    //   this.new_action(this.status_id, { Type: 'CreateTask', Title: 'Feature ++', IsProject: true, Parent: 1 });
    //   this.status_id++;
    // }, 2000);
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
    return this.tasks[id];
  }
}

const wn = new WhatsNext();

export default wn;
