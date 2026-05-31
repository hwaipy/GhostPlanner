import { computed, ComputedRef } from 'vue';
import moment from 'moment';
import wn from './WhatsNext';
import { INBOX_ID } from './types';
import { isAvailable } from './format';

export interface Perspective {
  name: string;
  label: string;
  icon: string;
  color: string;
  to: string;
  count: number;
  // OmniFocus iPhone shows 5 perspectives in the bottom tab bar; the rest
  // (here: Review) live in the overflow menu / sidebar only.
  mobileTab?: boolean;
}

function dueSoon(n: any) {
  return n.due >= 0 && moment(n.due).startOf('day').diff(moment().startOf('day'), 'days') <= 0;
}

export function usePerspectives(): ComputedRef<Perspective[]> {
  return computed(() => {
    const all = wn.all_nodes();
    const inbox = wn.get_task_node(INBOX_ID);
    return [
      {
        name: 'inbox', mobileTab: true,
        label: 'Inbox',
        icon: 'inbox',
        color: '#5e9bff',
        to: '/inbox',
        count: inbox ? inbox.children.filter((c: any) => c.status === 'Active').length : 0,
      },
      {
        name: 'projects', mobileTab: true,
        label: 'Projects',
        icon: 'workspaces',
        color: '#6C4FE0',
        to: '/projects',
        count: all.filter((n: any) => n.isProject && n.label !== INBOX_ID && n.status === 'Active').length,
      },
      {
        name: 'forecast', mobileTab: true,
        label: 'Forecast',
        icon: 'dashboard',
        color: '#ff453a',
        to: '/forecast',
        count: all.filter((n: any) => !n.isProject && isAvailable(n) && dueSoon(n)).length,
      },
      {
        name: 'flagged', mobileTab: true,
        label: 'Flagged',
        icon: 'flag',
        color: '#ff9f0a',
        to: '/flagged',
        count: all.filter((n: any) => n.flagged && !n.isProject && isAvailable(n)).length,
      },
      {
        name: 'tags', mobileTab: true,
        label: 'Tags',
        icon: 'local_offer',
        color: '#30b0c7',
        to: '/tags',
        count: wn.tags.length,
      },
      {
        name: 'review',
        label: 'Review',
        icon: 'rate_review',
        color: '#34c759',
        to: '/review',
        count: all.filter((n: any) => n.isProject && n.label !== INBOX_ID && n.status === 'Active').length,
      },
    ];
  });
}
