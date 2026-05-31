// Every node is either a project (isProject: true) or an action (isProject: false).
// Hierarchy rules (enforced in WhatsNext.canPlace):
//   - the root contains only projects;
//   - a project may contain projects and actions;
//   - an action may contain only actions (never a project).
export type ActionPayload =
  | { type: 'CreateTask'; title: string; isProject: boolean; parent: string | null }
  | { type: 'ModifyTask'; task: string; property: string; oldValue: unknown; newValue: unknown }
  | { type: 'DeleteTask'; task: string }
  | { type: 'MoveTask'; task: string; parent: string | null; index: number };

export interface ActionRecord {
  uid: string;
  seq: number | null; // server-assigned global order; null = not yet synced
  lseq: number; // local monotonic order, used to sort un-synced actions deterministically
  ts: string; // ISO timestamp of creation
  action: ActionPayload;
}

export interface SyncedAction {
  uid: string;
  seq: number;
  ts: string;
  action: ActionPayload;
}

// Local persistence contract (implemented by LocalStore; mockable in tests).
export interface ActionStore {
  allActions(): Promise<ActionRecord[]>;
  putAction(rec: ActionRecord): Promise<void>;
  putActions(recs: ActionRecord[]): Promise<void>;
  getMeta<T>(key: string, fallback: T): Promise<T>;
  setMeta<T>(key: string, value: T): Promise<void>;
}

// Remote sync contract (implemented by WhatsNextServer; mockable in tests).
export interface SyncTransport {
  sync(name: string, after: number, actions: ActionRecord[]): Promise<SyncedAction[]>;
}

export const ROOT_ID = '__root__';

// Reserved fixed-uid Inbox project (root-level). A fixed uid keeps it unique
// across devices — the server dedups by uid, so concurrent clients can't create
// duplicate Inboxes.
export const INBOX_ID = '__inbox__';
