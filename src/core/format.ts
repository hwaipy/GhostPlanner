import moment from 'moment';

export interface Badge {
  text: string;
  cls: string;
}

function dayDiff(ms: number): number {
  return moment(ms).startOf('day').diff(moment().startOf('day'), 'days');
}

function shortDate(ms: number): string {
  const m = moment(ms);
  const diff = dayDiff(ms);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff < 7) return m.format('ddd');
  if (diff < 0 && diff > -7) return m.format('ddd');
  return m.format('M/D');
}

// Due date badge: red if today/overdue, orange if within ~3 days.
export function dueBadge(ms: number): Badge | null {
  if (ms == null || ms < 0) return null;
  const diff = dayDiff(ms);
  let cls = 'gp-badge--tag';
  if (diff <= 0) cls = 'gp-badge--due';
  else if (diff <= 3) cls = 'gp-badge--soon';
  return { text: shortDate(ms), cls };
}

// Defer date badge: only meaningful while still in the future.
export function deferBadge(ms: number): Badge | null {
  if (ms == null || ms < 0) return null;
  if (dayDiff(ms) <= 0) return null;
  return { text: 'Starts ' + shortDate(ms), cls: 'gp-badge--defer' };
}

export function fmtDuration(seconds: number): string {
  if (!seconds || seconds < 1) return '';
  const day = Math.floor(seconds / 86400);
  const hour = Math.floor((seconds % 86400) / 3600);
  const min = Math.floor((seconds % 3600) / 60);
  return [day && day + 'd', hour && hour + 'h', min && min + 'm'].filter(Boolean).join(' ');
}

export function isDeferred(node: any): boolean {
  return node.deferUntil >= 0 && dayDiff(node.deferUntil) > 0;
}

// A node is "available" when:
//   - it is Active, not deferred into the future, AND
//   - if its parent is a sequential project, it is the first non-finished child.
//   - its containing project is itself Active and not deferred.
export function isAvailable(node: any): boolean {
  if (node.status !== 'Active' || isDeferred(node)) return false;
  const parent = node.parent;
  if (parent && !parent.isRoot) {
    if (parent.status !== 'Active' || isDeferred(parent)) return false;
    if (parent.isProject && parent.parallel === false) {
      const firstActive = parent.children.find((c: any) => c.status === 'Active');
      if (firstActive !== node) return false;
    }
  }
  return true;
}

export function isDone(node: any): boolean {
  return node.status === 'Completed' || node.status === 'Dropped';
}

// Children to show in a list, honouring the show-completed toggle.
export function visibleChildren(node: any, showCompleted: boolean): any[] {
  return node.children.filter((c: any) => showCompleted || !isDone(c));
}
