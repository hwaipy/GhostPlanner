import { reactive } from 'vue';

const BASE = import.meta.env?.PROD ? '/s/' : 'http://localhost:8002/s/';
const TOKEN_KEY = 'gp-token';

function lsGet(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}
function lsSet(t: string) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* non-browser env */
  }
}

export const auth = reactive({
  token: lsGet(),
});

function setToken(t: string) {
  auth.token = t;
  lsSet(t);
}

export function logout() {
  auth.token = '';
  lsSet('');
}

export function authHeader(): Record<string, string> {
  return auth.token ? { Authorization: 'Bearer ' + auth.token } : {};
}

export async function authConfigured(): Promise<boolean> {
  const r = await fetch(BASE + 'AuthStatus');
  if (!r.ok) throw new Error('Server unreachable');
  return !!(await r.json()).configured;
}

async function post(endpoint: string, body: unknown): Promise<any> {
  const r = await fetch(BASE + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function login(user: string, password: string): Promise<void> {
  setToken((await post('Login', { user, password })).token);
}

export async function setupPassword(user: string, password: string): Promise<void> {
  setToken((await post('SetPassword', { user, password })).token);
}
