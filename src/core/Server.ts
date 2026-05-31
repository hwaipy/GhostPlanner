import { ActionRecord, ActionPayload, SyncedAction, SyncTransport } from './types';
import { authHeader, logout } from './auth';

interface PushAction {
  uid: string;
  ts: string;
  action: ActionPayload;
}

export class WhatsNextServer implements SyncTransport {
  // In production the SPA is served by the Python server on the same origin, so
  // use a relative URL (works behind HTTPS at plan.hwaipy.cn). In dev, talk to
  // the local sync server directly on :8002.
  server_url = import.meta.env?.PROD ? '/s/' : 'http://localhost:8002/s/';

  async sync(name: string, after: number, actions: ActionRecord[]): Promise<SyncedAction[]> {
    const push: PushAction[] = actions.map((a) => ({ uid: a.uid, ts: a.ts, action: a.action }));
    const response = await fetch(this.server_url + 'Sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ name, after, actions: push }),
    });
    if (response.status === 401) {
      logout(); // token missing/expired -> drop back to the login screen
      throw new Error('Unauthorized');
    }
    if (!response.ok) {
      throw new Error('Sync failed: HTTP ' + response.status);
    }
    const body = await response.json();
    return body.actions as SyncedAction[];
  }
}

const wnserver = new WhatsNextServer();
export default wnserver;
