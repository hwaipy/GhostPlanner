import { ActionRecord, ActionStore } from './types';

const DB_VERSION = 1;
const STORE_ACTIONS = 'actions';
const STORE_META = 'meta';

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export class LocalStore implements ActionStore {
  private db: IDBDatabase | null = null;

  constructor(private dbName = 'ghostplanner') {}

  async open(): Promise<void> {
    if (this.db) return;
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(this.dbName, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_ACTIONS)) {
          db.createObjectStore(STORE_ACTIONS, { keyPath: 'uid' });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private store(name: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error('LocalStore not opened');
    return this.db.transaction(name, mode).objectStore(name);
  }

  async allActions(): Promise<ActionRecord[]> {
    await this.open();
    return promisify(this.store(STORE_ACTIONS, 'readonly').getAll() as IDBRequest<ActionRecord[]>);
  }

  async putAction(rec: ActionRecord): Promise<void> {
    await this.open();
    await promisify(this.store(STORE_ACTIONS, 'readwrite').put(rec));
  }

  async putActions(recs: ActionRecord[]): Promise<void> {
    if (recs.length === 0) return;
    await this.open();
    const tx = this.db!.transaction(STORE_ACTIONS, 'readwrite');
    const os = tx.objectStore(STORE_ACTIONS);
    for (const rec of recs) os.put(rec);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getMeta<T>(key: string, fallback: T): Promise<T> {
    await this.open();
    const row = await promisify(this.store(STORE_META, 'readonly').get(key) as IDBRequest<{ key: string; value: T } | undefined>);
    return row ? row.value : fallback;
  }

  async setMeta<T>(key: string, value: T): Promise<void> {
    await this.open();
    await promisify(this.store(STORE_META, 'readwrite').put({ key, value }));
  }
}

const localStore = new LocalStore();
export default localStore;
