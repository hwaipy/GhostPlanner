// Shared test helpers: fresh local stores, an in-memory mock sync server that
// mirrors the real server protocol, and a controllable navigator.onLine.
import 'fake-indexeddb/auto';
import { afterEach } from 'node:test';
import type { ActionRecord, SyncedAction, SyncTransport, ActionPayload } from '../src/core/types';
import { LocalStore } from '../src/core/LocalStore';
import type { WhatsNext } from '../src/core/WhatsNext';

// Track engines created in a test so their debounced sync timers don't outlive it.
const live: WhatsNext[] = [];
export function track(wn: WhatsNext): WhatsNext {
  live.push(wn);
  return wn;
}
afterEach(() => {
  while (live.length) live.pop()!.dispose();
});

let dbCounter = 0;
export function freshStore(): LocalStore {
  return new LocalStore('test-db-' + Date.now() + '-' + ++dbCounter);
}

// In-memory server with the same semantics as server.py: dedup by uid,
// monotonic seq per arrival, pull returns everything with seq > after.
export class MockServer implements SyncTransport {
  rows: SyncedAction[] = [];
  private seen = new Set<string>();
  syncCalls = 0;
  failNext = false;
  offline = false;

  async sync(_name: string, after: number, actions: ActionRecord[]): Promise<SyncedAction[]> {
    this.syncCalls++;
    if (this.offline) {
      throw new TypeError('Failed to fetch');
    }
    if (this.failNext) {
      this.failNext = false;
      throw new Error('simulated server error');
    }
    for (const a of actions) {
      if (this.seen.has(a.uid)) continue;
      this.seen.add(a.uid);
      this.rows.push({ uid: a.uid, seq: this.rows.length + 1, ts: a.ts, action: a.action });
    }
    return this.rows.filter((r) => r.seq > after).map((r) => ({ ...r }));
  }
}

// Controllable navigator.onLine (WhatsNext treats onLine === false as offline).
const nav = { onLine: true };
Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true });
export function setOnline(v: boolean) {
  nav.onLine = v;
}

export const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms));

export function createTaskRecord(uid: string, payload: ActionPayload, seq: number | null = null, lseq = 0): ActionRecord {
  return { uid, seq, lseq, ts: '2026-01-01T00:00:00Z', action: payload };
}
