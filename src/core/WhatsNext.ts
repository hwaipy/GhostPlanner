import wnserver from './Server';
import localStore from './LocalStore';
import { ActionRecord, ActionPayload, ActionStore, SyncTransport, ROOT_ID, INBOX_ID } from './types';
import { ref, markRaw, toRaw } from 'vue';

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error';

const SYNC_DEBOUNCE_MS = 800;

export class WhatsNext {
  name = 'hwaipy';
  validProperties = ['title', 'note', 'status', 'flagged', 'tags', 'estimatedDuration', 'deferUntil', 'due', 'parallel'];

  task_model = ref(new Task({ whatsNext: this, label: ROOT_ID, isRoot: true }));
  tasks: Record<string, Task> = {};
  tags: string[] = [];
  syncStatus = ref<SyncStatus>('idle');

  private server: SyncTransport;
  private store: ActionStore;

  private records: ActionRecord[] = [];
  private recordsByUid: Record<string, ActionRecord> = {};
  private appliedUids = new Set<string>();
  private lseqCounter = 0;

  private syncing = false;
  private pendingSync = false;
  private syncTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(opts: { server?: SyncTransport; store?: ActionStore } = {}) {
    this.server = opts.server ?? wnserver;
    this.store = opts.store ?? localStore;
    // Keep the engine out of Vue's reactive graph: it is reachable from the
    // reactive task tree (Task.whatsNext), and a reactive proxy would auto-unwrap
    // refs like syncStatus, breaking `this.syncStatus.value = ...` inside methods.
    markRaw(this);
  }

  async init() {
    this.task_model.value.children.splice(0, this.task_model.value.children.length);
    this.tasks = {};
    this.tags = [];
    this.records = [];
    this.recordsByUid = {};
    this.appliedUids = new Set<string>();

    this.lseqCounter = await this.store.getMeta('lseqCounter', 0);

    const stored = await this.store.allActions();
    stored.sort(compareRecords);
    for (const rec of stored) {
      this.records.push(rec);
      this.recordsByUid[rec.uid] = rec;
      this.applyRecord(rec);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.sync());
    }
    this.sync();
  }

  private applyRecord(rec: ActionRecord) {
    if (this.appliedUids.has(rec.uid)) return;
    this.applyAction(rec.action, rec.uid);
    this.appliedUids.add(rec.uid);
  }

  private applyAction(action: ActionPayload, uid: string) {
    switch (action.type) {
      case 'CreateTask': {
        const parent = action.parent ? this.tasks[action.parent] : null;
        if (!this.canPlace(action.isProject, action.parent)) {
          console.warn('CreateTask violates hierarchy rules (applying anyway):', uid, action);
        }
        const task = new Task({
          whatsNext: this,
          label: uid,
          title: action.title,
          isProject: action.isProject,
          parent,
        });
        const siblings = parent ? parent.children : this.task_model.value.children;
        siblings.push(task);
        this.tasks[task.label] = siblings[siblings.length - 1];
        break;
      }
      case 'ModifyTask': {
        const target = this.tasks[action.task];
        if (!target) {
          console.warn('ModifyTask references unknown task:', action.task);
          return;
        }
        if (!this.validProperties.includes(action.property)) {
          console.warn('Modifying invalid property:', action.property);
          return;
        }
        if (!equals((target as any)[action.property], action.oldValue)) {
          console.warn('oldValue mismatch (applying anyway):', action.task, action.property);
        }
        (target as any)[action.property] = action.newValue;
        if (action.property === 'tags') {
          for (const tag of action.newValue as string[]) {
            if (!this.tags.includes(tag)) this.tags.push(tag);
          }
        }
        break;
      }
      case 'DeleteTask': {
        const target = this.tasks[action.task];
        if (!target) return;
        const siblings = target.parent ? target.parent.children : this.task_model.value.children;
        const i = siblings.indexOf(target);
        if (i >= 0) siblings.splice(i, 1);
        const stack = [target];
        while (stack.length) {
          const n = stack.pop() as Task;
          delete this.tasks[n.label];
          for (const c of n.children) stack.push(c);
        }
        break;
      }
      case 'MoveTask': {
        const target = this.tasks[action.task];
        if (!target) return;
        const oldSiblings = target.parent ? target.parent.children : this.task_model.value.children;
        const oi = oldSiblings.indexOf(target);
        if (oi >= 0) oldSiblings.splice(oi, 1);
        const newParent = action.parent ? this.tasks[action.parent] : null;
        target.parent = newParent;
        const newSiblings = newParent ? newParent.children : this.task_model.value.children;
        const idx = Math.max(0, Math.min(action.index, newSiblings.length));
        newSiblings.splice(idx, 0, target);
        break;
      }
      default:
        console.warn('Unknown action type:', (action as any).type);
    }
  }

  private async createAction(payload: ActionPayload, uid: string) {
    const rec: ActionRecord = {
      uid,
      seq: null,
      lseq: ++this.lseqCounter,
      ts: new Date().toISOString(),
      // Strip Vue reactivity: payload values may be read from reactive task
      // nodes, and IndexedDB's structured clone cannot serialize Proxies.
      action: JSON.parse(JSON.stringify(payload)) as ActionPayload,
    };
    this.records.push(rec);
    this.recordsByUid[uid] = rec;
    this.applyRecord(rec);

    await this.store.putAction(rec);
    await this.store.setMeta('lseqCounter', this.lseqCounter);
    this.scheduleSync();
  }

  get_task_node(id: string | null): Task {
    if (id == null) return this.task_model.value;
    return this.tasks[id];
  }

  set_property(task: string, key: string, newValue: unknown) {
    const oldValue = (this.get_task_node(task) as any)[key];
    if (equals(oldValue, newValue)) return;
    this.createAction({ type: 'ModifyTask', task, property: key, oldValue, newValue }, crypto.randomUUID());
  }

  // Hierarchy rules: the root holds only projects; a project may contain both
  // projects and actions; an action may contain only actions (never a project).
  canPlace(childIsProject: boolean, parentUid: string | null): boolean {
    const parent = parentUid == null ? null : this.get_task_node(parentUid);
    if (childIsProject) return parent == null || parent.isProject;
    return parent != null;
  }

  create_task({ title = '', isProject = false, parent = null }: { title?: string; isProject?: boolean; parent?: string | null }): string {
    if (!this.canPlace(isProject, parent)) {
      const where = parent == null ? 'the root' : this.get_task_node(parent).isProject ? 'a project' : 'an action';
      throw new Error(`Invalid placement: ${isProject ? 'a project' : 'an action'} cannot be created under ${where}.`);
    }
    const uid = crypto.randomUUID();
    this.createAction({ type: 'CreateTask', title, isProject, parent }, uid);
    return uid;
  }

  delete_task(uid: string) {
    if (uid === ROOT_ID || !this.tasks[uid]) return;
    this.createAction({ type: 'DeleteTask', task: uid }, crypto.randomUUID());
  }

  move_task(uid: string, parent: string | null, index: number) {
    const node = this.tasks[uid];
    if (!node) return;
    if (!this.canPlace(node.isProject, parent)) {
      throw new Error('Invalid move: target placement violates hierarchy rules.');
    }
    this.createAction({ type: 'MoveTask', task: uid, parent, index }, crypto.randomUUID());
  }

  toggle_complete(uid: string) {
    const node = this.tasks[uid];
    if (!node) return;
    this.set_property(uid, 'status', node.status === 'Completed' ? 'Active' : 'Completed');
  }

  // The Inbox is a reserved root-level project with a fixed uid; create it lazily.
  ensure_inbox(): string {
    if (!this.tasks[INBOX_ID]) {
      this.createAction({ type: 'CreateTask', title: 'Inbox', isProject: true, parent: null }, INBOX_ID);
    }
    return INBOX_ID;
  }

  add_to_inbox(title: string): string {
    return this.create_task({ title, isProject: false, parent: this.ensure_inbox() });
  }

  // Flattened list of all nodes (excludes the root). Reactive-friendly for perspectives.
  all_nodes(): Task[] {
    const out: Task[] = [];
    const stack: Task[] = [...this.task_model.value.children];
    while (stack.length) {
      const n = stack.shift() as Task;
      out.push(n);
      for (const c of n.children) stack.push(c);
    }
    return out;
  }

  get_project_node(taskNode: Task): Task {
    if (taskNode.isRoot) return taskNode;
    if (taskNode.isProject) return taskNode;
    if (taskNode.parent == null) return taskNode;
    return this.get_project_node(taskNode.parent);
  }

  private scheduleSync() {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.syncTimer = null;
      this.sync();
    }, SYNC_DEBOUNCE_MS);
  }

  dispose() {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
  }

  async sync() {
    // We never trust navigator.onLine — some embedded WebViews (e.g. HarmonyOS)
    // report it false even on a working network. Just try the fetch and let the
    // outcome decide: TypeError -> offline, other errors -> error, success -> idle.
    if (this.syncing) {
      this.pendingSync = true;
      return;
    }
    this.syncing = true;
    this.syncStatus.value = 'syncing';
    try {
      const lastSyncedSeq = await this.store.getMeta('lastSyncedSeq', 0);
      const unsynced = this.records.filter((r) => r.seq === null);
      const remote = await this.server.sync(this.name, lastSyncedSeq, unsynced);

      let maxSeq = lastSyncedSeq;
      const toPersist: ActionRecord[] = [];
      for (const ra of remote) {
        maxSeq = Math.max(maxSeq, ra.seq);
        if (this.appliedUids.has(ra.uid)) {
          const existing = this.recordsByUid[ra.uid];
          if (existing && existing.seq === null) {
            existing.seq = ra.seq;
            toPersist.push(existing);
          }
        } else {
          const rec: ActionRecord = { uid: ra.uid, seq: ra.seq, lseq: ++this.lseqCounter, ts: ra.ts, action: ra.action };
          this.records.push(rec);
          this.recordsByUid[rec.uid] = rec;
          this.applyRecord(rec);
          toPersist.push(rec);
        }
      }

      await this.store.putActions(toPersist);
      await this.store.setMeta('lastSyncedSeq', maxSeq);
      await this.store.setMeta('lseqCounter', this.lseqCounter);
      this.syncStatus.value = 'idle';
    } catch (e: any) {
      console.warn('Sync error:', e);
      // A bare fetch failure throws TypeError ("Failed to fetch" / "NetworkError").
      // Treat that as offline; anything else (e.g. 5xx, parse) is a real error.
      const netError =
        e instanceof TypeError || (typeof e?.message === 'string' && /fetch|network/i.test(e.message));
      this.syncStatus.value = netError ? 'offline' : 'error';
    } finally {
      this.syncing = false;
      if (this.pendingSync) {
        this.pendingSync = false;
        this.sync();
      }
    }
  }
}

class Task {
  whatsNext: WhatsNext;
  label: string;
  isRoot: boolean;
  title: string;
  note: string;
  isProject: boolean;
  parallel: boolean; // projects only; true = any child available, false = sequential (only first unfinished)
  children: Task[];
  parent: Task | null;
  status: string;
  tags: string[];
  flagged: boolean;
  estimatedDuration: number;
  deferUntil: number;
  due: number;

  constructor({
    whatsNext,
    label,
    isRoot = false,
    title = '',
    note = '',
    isProject = false,
    parallel = true,
    children = [],
    parent = null,
    status = 'Active',
    tags = [],
    flagged = false,
    estimatedDuration = 0,
    deferUntil = -1,
    due = -1,
  }: {
    whatsNext: WhatsNext;
    label: string;
    isRoot?: boolean;
    title?: string;
    note?: string;
    isProject?: boolean;
    parallel?: boolean;
    children?: Task[];
    parent?: Task | null;
    status?: string;
    tags?: string[];
    flagged?: boolean;
    estimatedDuration?: number;
    deferUntil?: number;
    due?: number;
  }) {
    this.whatsNext = toRaw(whatsNext);
    this.label = label;
    this.isRoot = isRoot;
    this.title = title;
    this.note = note;
    this.isProject = isProject;
    this.parallel = parallel;
    this.children = children;
    this.parent = parent;
    this.status = status;
    this.tags = tags;
    this.flagged = flagged;
    this.estimatedDuration = estimatedDuration;
    this.deferUntil = deferUntil;
    this.due = due;
  }

  set_property(key: string, value: unknown) {
    this.whatsNext.set_property(this.label, key, value);
  }

  get_project_node(): Task {
    return this.whatsNext.get_project_node(this.whatsNext.get_task_node(this.label));
  }
}

function compareRecords(a: ActionRecord, b: ActionRecord): number {
  const sa = a.seq ?? Number.MAX_SAFE_INTEGER;
  const sb = b.seq ?? Number.MAX_SAFE_INTEGER;
  if (sa !== sb) return sa - sb;
  return a.lseq - b.lseq;
}

function equals(a: unknown, b: unknown): boolean {
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  return a == b;
}

const wn = new WhatsNext();
export default wn;
