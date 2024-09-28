import wnserver from './Server';
import { ref } from 'vue';
import moment from 'moment';

class WhatsNext {
  status_id = 0;
  actions = [];
  task_model = ref(
    new Task({
      whatsNext: this,
      label: -1,
    })
  );
  tasks: any = {};
  validProperties = ['title', 'status', 'flagged', 'tags', 'estimatedDuration', 'deferUntil', 'due'];
  tags: string[] = [];

  async init() {
    this.status_id = 0;
    this.actions = [];
    this.task_model.value.children.splice(0, this.task_model.value.children.length);
    this.tasks = {};

    const actions = await wnserver.get_new_actions(-1);
    for (const i in actions) {
      const action = actions[i];
      this.new_action(action.id, action.action);
      this.status_id = action.id;
    }
  }

  new_action(id: number, action: any) {
    switch (action.type) {
      case 'CreateTask':
        const task = new Task({
          whatsNext: this,
          label: id,
          title: action.title,
          isProject: action.isProject,
          parent: action.parent ? this.tasks[action.parent] : null,
        });
        const parentChildrenList = task.parent ? this.tasks[action.parent].children : this.task_model.value.children;
        parentChildrenList.push(task);
        this.tasks[id] = parentChildrenList[parentChildrenList.length - 1];
        break;
      case 'ModifyTask':
        const modifiedTask = this.tasks[action.task];
        const property = action.property;
        if (this.validProperties.includes(property)) {
          if (!equals(modifiedTask[property], action.oldValue)) console.log('The oldValue is not match: ', action.task, action.property, modifiedTask[property], action.oldValue);
          else {
            modifiedTask[property] = action.newValue;
            if (property === 'tags') {
              for (const iTag in action.newValue) {
                const tag: string = action.newValue[iTag];
                if (!this.tags.includes(tag)) {
                  this.tags.push(tag);
                }
              }
            }
          }
        } else {
          console.log('Modifing invalid property: ' + property);
        }

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
        console.log('Unknown action type: ' + action.type);
    }
  }

  get_task_node(id: number) {
    if (id == null) return this.task_model.value;
    return this.tasks[id];
  }

  set_property(task: number, key: string, newValue: unknown) {
    const oldValue = this.get_task_node(task)[key];
    if (equals(oldValue, newValue)) return;
    this.create_action({ type: 'ModifyTask', task: task, property: key, oldValue: oldValue, newValue: newValue });
  }

  create_action(content: object) {
    this.status_id += 1;
    const action = { id: this.status_id, time: moment().format('YYYY-MM-DD HH:mm:ss.SSSSSS+08:00'), action: content };
    this.actions.push(action);
    this.new_action(action.id, action.action);
    wnserver.append(action);
  }

  get_project_node(taskNode: Task): Task {
    if (taskNode.label < 0) {
      console.log('Invalid task: root.');
      return taskNode;
    }
    if (taskNode.isProject) return taskNode;
    if (taskNode.parent == null) throw 'Invalid Task Parent: null';
    return this.get_project_node(taskNode.parent);
  }
}

class Task {
  whatsNext: WhatsNext;
  label: number;
  title: string;
  isProject: boolean;
  children: Task[];
  parent: Task | null;
  status: string;
  tags: string[];
  flagged: boolean;
  estimatedDuration: number;
  deferUntil: number;
  due: number;

  constructor({ whatsNext, label, title = '', isProject = false, children = [], parent = null, status = 'Active', tags = [], flagged = false, estimatedDuration = 0, deferUntil = -1, due = -1 }: { whatsNext: WhatsNext; label: number; title?: string; isProject?: boolean; children?: Task[]; parent?: Task | null; status?: string; tags?: string[]; flagged?: boolean; estimatedDuration?: number; deferUntil?: number; due?: number }) {
    this.whatsNext = whatsNext;
    this.label = label;
    this.title = title;
    this.isProject = isProject;
    this.children = children;
    this.parent = parent;
    this.status = status;
    this.tags = tags;
    this.flagged = flagged;
    this.estimatedDuration = estimatedDuration;
    this.deferUntil = deferUntil;
    this.due = due;
  }

  set_property(key: string, value: any) {
    this.whatsNext.set_property(this.label, key, value);
  }

  get_project_node() {
    return this.whatsNext.get_project_node(this.whatsNext.get_task_node(this.label));
  }
}

function equals(a: unknown, b: unknown) {
  if (Array.isArray(a)) {
    if (Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    } else return false;
  } else return a == b;
}

const wn = new WhatsNext();

export default wn;
