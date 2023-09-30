import wnserver from './Server';

class WhatsNext {
  inited = false;
  status_id = 0;
  actions = [];
  task_model: any[] = [
    {
      label: '2',
      ee: 'ee',
      avatar: 'https://cdn.quasar.dev/img/boy-avatar.png',
      children: [
        {
          label: 'Good food (with icon)',
          icon: 'restaurant_menu',
          children: [
            { label: 'Quality ingredients' },
            { label: 'Good recipe' },
          ],
        },
        {
          label: 'Good service (disabled node with icon)',
          icon: 'room_service',
          disabled: true,
          children: [
            { label: 'Prompt attention' },
            { label: 'Professional waiter' },
          ],
        },
        {
          label: 'Pleasant surroundings (with icon)',
          icon: 'photo',
          children: [
            {
              label: 'Happy atmosphere (with image)',
              img: 'https://cdn.quasar.dev/img/logo_calendar_128px.png',
            },
            { label: 'Good table presentation' },
            { label: 'Pleasing decor' },
          ],
        },
      ],
    },
  ];

  tasks: any = {};

  async init() {
    if (this.inited) throw 'Already initted.';
    const actions = await wnserver.get_new_actions(-1);
    for (const i in actions) {
      const action = actions[i];
      this.new_action(actions.id, action.action);
    }
    this.inited = true;

    const tm = this.task_model;
    setInterval(function () {
      console.log('inte');
      tm[0]['label'] = tm[0]['label'] + '0';
      tm.push({
        label: '2',
      });
    }, 1000);
  }

  new_action(id: number, action: any) {
    switch (action.Type) {
      case 'CreateTask':
        const task = {
          id: id,
          Title: action.Title,
        };
        this.tasks[id] = task;
        this.task_model.push(task);
        // console.log('C');
        // console.log(this.task_model[0]['label']);
        // this.task_model[0]['label'] = 'eeee';
        break;
      case 'ModifyTask':
        console.log('M');
        break;
      default:
        console.log('Unknown action type: ' + action.Type);
    }
  }

  test() {
    wnserver.test();
  }
}

const wn = new WhatsNext();

export default wn;
