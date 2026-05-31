import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshStore, MockServer, setOnline, tick, createTaskRecord, track } from './helpers.mts';
import { WhatsNext } from '../src/core/WhatsNext';

const titles = (wn: any) => wn.task_model.value.children.map((t: any) => t.title);
const child = (wn: any, title: string) => wn.task_model.value.children.find((t: any) => t.title === title);

test('replay: rebuilds task tree (parent/child, props, tags) from stored log', async () => {
  setOnline(true);
  const store = freshStore();
  await store.putActions([
    createTaskRecord('p', { type: 'CreateTask', title: 'Proj', isProject: true, parent: null }, 1, 1),
    createTaskRecord('c', { type: 'CreateTask', title: 'Task', isProject: false, parent: 'p' }, 2, 2),
    createTaskRecord('m1', { type: 'ModifyTask', task: 'c', property: 'flagged', oldValue: false, newValue: true }, 3, 3),
    createTaskRecord('m2', { type: 'ModifyTask', task: 'c', property: 'tags', oldValue: [], newValue: ['Home', 'Lab'] }, 4, 4),
  ]);
  const wn = track(new WhatsNext({ store, server: new MockServer() }))
  await wn.init();
  await tick();

  assert.deepEqual(titles(wn), ['Proj']); // only top-level project at root
  const proj = child(wn, 'Proj');
  assert.equal(proj.children.length, 1);
  assert.equal(proj.children[0].title, 'Task');
  assert.equal(proj.children[0].flagged, true);
  assert.deepEqual(proj.children[0].tags, ['Home', 'Lab']);
  assert.deepEqual(wn.tags, ['Home', 'Lab']); // tag registry populated
});

test('create_task: persists locally, syncs, gets server seq', async () => {
  setOnline(true);
  const server = new MockServer();
  const store = freshStore();
  const wn = track(new WhatsNext({ store, server }))
  await wn.init();
  await tick();

  const uid = wn.create_task({ title: 'New', isProject: true, parent: null });
  await tick();
  await wn.sync();
  await tick();

  assert.ok(titles(wn).includes('New'));
  assert.equal((wn as any).recordsByUid[uid].seq, 1);
  assert.equal(wn.syncStatus.value, 'idle');
  assert.equal(server.rows.length, 1);
  assert.equal(server.rows[0].action.title, 'New');
  // persisted to local store too
  assert.ok((await store.allActions()).some((r) => r.uid === uid));
});

test('set_property: emits ModifyTask, applies, and is a no-op when unchanged', async () => {
  setOnline(true);
  const server = new MockServer();
  const wn = track(new WhatsNext({ store: freshStore(), server }))
  await wn.init();
  await tick();
  const uid = wn.create_task({ title: 'T', isProject: true, parent: null });
  await tick();

  const node = wn.get_task_node(uid);
  node.set_property('flagged', true);
  node.set_property('tags', ['x']);
  await tick();
  assert.equal(node.flagged, true);
  assert.deepEqual(node.tags, ['x']);

  const before = (wn as any).records.length;
  node.set_property('flagged', true); // unchanged -> no new action
  assert.equal((wn as any).records.length, before);
});

test('two devices: a write on A is pulled by B (two-way sync)', async () => {
  setOnline(true);
  const server = new MockServer();
  const A = track(new WhatsNext({ store: freshStore(), server }))
  const B = track(new WhatsNext({ store: freshStore(), server }))
  await A.init();
  await tick();

  A.create_task({ title: 'fromA', isProject: true, parent: null });
  await tick();
  await A.sync();
  await tick();

  await B.init(); // init triggers a sync -> pulls fromA
  await tick();
  assert.ok(titles(B).includes('fromA'));
});

test('reconcile: own pushed action gets seq backfilled, no duplicate on re-sync', async () => {
  setOnline(true);
  const server = new MockServer();
  const wn = track(new WhatsNext({ store: freshStore(), server }))
  await wn.init();
  await tick();
  const uid = wn.create_task({ title: 'X', isProject: true, parent: null });
  await tick();

  await wn.sync();
  await tick();
  assert.equal((wn as any).recordsByUid[uid].seq, 1);
  const countAfterFirst = (wn as any).records.length;

  await wn.sync(); // second sync should be a no-op for the tree
  await tick();
  assert.equal((wn as any).records.length, countAfterFirst);
  assert.equal(titles(wn).filter((t: string) => t === 'X').length, 1);
});

test('offline: writes queue locally; reconnect flushes them', async () => {
  setOnline(true);
  const server = new MockServer();
  const wn = track(new WhatsNext({ store: freshStore(), server }))
  await wn.init();
  await tick();

  server.offline = true;
  const uid = wn.create_task({ title: 'Offline', isProject: true, parent: null });
  await tick();
  await wn.sync(); // fetch fails -> status offline, write stays queued
  assert.equal(wn.syncStatus.value, 'offline');
  assert.equal(server.rows.length, 0);
  assert.equal((wn as any).recordsByUid[uid].seq, null);
  assert.ok(titles(wn).includes('Offline')); // still usable offline

  server.offline = false;
  await wn.sync();
  await tick();
  assert.equal(wn.syncStatus.value, 'idle');
  assert.equal(server.rows.length, 1);
  assert.notEqual((wn as any).recordsByUid[uid].seq, null);
  assert.equal((wn as any).records.filter((r: any) => r.seq === null).length, 0);
});

test('reload: state is restored from the local store', async () => {
  setOnline(true);
  const server = new MockServer();
  const store = freshStore();
  const wn1 = track(new WhatsNext({ store, server }))
  await wn1.init();
  await tick();
  wn1.create_task({ title: 'Persisted', isProject: true, parent: null });
  await tick();
  await wn1.sync();
  await tick();

  const wn2 = track(new WhatsNext({ store, server })) // simulate reload: same store
  await wn2.init();
  await tick();
  assert.ok(titles(wn2).includes('Persisted'));
});

test('sync error: status becomes "error" and writes stay queued', async () => {
  setOnline(true);
  const server = new MockServer();
  const wn = track(new WhatsNext({ store: freshStore(), server }))
  await wn.init();
  await tick();
  const uid = wn.create_task({ title: 'Y', isProject: true, parent: null });
  await tick();

  server.failNext = true;
  await wn.sync();
  await tick();
  assert.equal(wn.syncStatus.value, 'error');
  assert.equal((wn as any).recordsByUid[uid].seq, null); // not lost

  await wn.sync(); // recovers
  await tick();
  assert.equal(wn.syncStatus.value, 'idle');
  assert.notEqual((wn as any).recordsByUid[uid].seq, null);
});

test('hierarchy: root holds only projects; projects nest both; actions hold only actions', async () => {
  setOnline(true);
  const wn = track(new WhatsNext({ store: freshStore(), server: new MockServer() }));
  await wn.init();
  await tick();

  // root: project ok, action rejected
  const proj = wn.create_task({ title: 'P', isProject: true, parent: null });
  assert.throws(() => wn.create_task({ title: 'A', isProject: false, parent: null }), /cannot be created under the root/);

  // under a project: both a sub-project and an action are allowed
  const subProj = wn.create_task({ title: 'SubP', isProject: true, parent: proj });
  const action = wn.create_task({ title: 'Act', isProject: false, parent: proj });
  await tick();
  assert.ok(wn.canPlace(true, proj));
  assert.ok(wn.canPlace(false, proj));

  // under an action: another action is allowed, a project is rejected
  const subAction = wn.create_task({ title: 'SubAct', isProject: false, parent: action });
  assert.throws(() => wn.create_task({ title: 'BadProj', isProject: true, parent: action }), /cannot be created under an action/);
  assert.equal(wn.canPlace(false, action), true);
  assert.equal(wn.canPlace(true, action), false);

  // sanity: the valid nodes were actually created
  assert.ok(subProj && action && subAction);
  assert.equal(wn.get_task_node(subAction).parent?.label, action);
});

test('delete_task removes the node and its whole subtree', async () => {
  setOnline(true);
  const wn = track(new WhatsNext({ store: freshStore(), server: new MockServer() }));
  await wn.init();
  await tick();
  const p = wn.create_task({ title: 'P', isProject: true, parent: null });
  const a = wn.create_task({ title: 'A', isProject: false, parent: p });
  const sub = wn.create_task({ title: 'Sub', isProject: false, parent: a });
  await tick();

  wn.delete_task(a); // removes A and its child Sub
  await tick();
  assert.equal(wn.get_task_node(a), undefined);
  assert.equal(wn.get_task_node(sub), undefined);
  assert.equal(wn.get_task_node(p).children.length, 0);
});

test('move_task reparents and reorders; rejects illegal placement', async () => {
  setOnline(true);
  const wn = track(new WhatsNext({ store: freshStore(), server: new MockServer() }));
  await wn.init();
  await tick();
  const p1 = wn.create_task({ title: 'P1', isProject: true, parent: null });
  const p2 = wn.create_task({ title: 'P2', isProject: true, parent: null });
  const a = wn.create_task({ title: 'A', isProject: false, parent: p1 });
  await tick();

  wn.move_task(a, p2, 0); // move action from P1 to P2
  await tick();
  assert.equal(wn.get_task_node(a).parent?.label, p2);
  assert.equal(wn.get_task_node(p1).children.length, 0);
  assert.equal(wn.get_task_node(p2).children[0].label, a);

  // a project cannot be moved under an action
  assert.throws(() => wn.move_task(p2, a, 0), /hierarchy rules/);
});

test('sequential project: only the first not-done child counts as available', async () => {
  setOnline(true);
  const wn = track(new WhatsNext({ store: freshStore(), server: new MockServer() }));
  await wn.init();
  await tick();
  const { isAvailable } = await import('../src/core/format');

  const p = wn.create_task({ title: 'Seq', isProject: true, parent: null });
  wn.set_property(p, 'parallel', false);
  const a1 = wn.create_task({ title: 'A1', isProject: false, parent: p });
  const a2 = wn.create_task({ title: 'A2', isProject: false, parent: p });
  const a3 = wn.create_task({ title: 'A3', isProject: false, parent: p });
  await tick();

  assert.equal(isAvailable(wn.get_task_node(a1)), true, 'A1 should be available');
  assert.equal(isAvailable(wn.get_task_node(a2)), false, 'A2 blocked behind A1');
  assert.equal(isAvailable(wn.get_task_node(a3)), false, 'A3 blocked behind A1');

  wn.toggle_complete(a1);
  await tick();
  assert.equal(isAvailable(wn.get_task_node(a2)), true, 'A2 unblocked after A1 completes');
  assert.equal(isAvailable(wn.get_task_node(a3)), false, 'A3 still blocked behind A2');
});

test('parallel project: every active child is available', async () => {
  setOnline(true);
  const wn = track(new WhatsNext({ store: freshStore(), server: new MockServer() }));
  await wn.init();
  await tick();
  const { isAvailable } = await import('../src/core/format');

  const p = wn.create_task({ title: 'Par', isProject: true, parent: null });
  const a1 = wn.create_task({ title: 'A1', isProject: false, parent: p });
  const a2 = wn.create_task({ title: 'A2', isProject: false, parent: p });
  await tick();

  assert.equal(isAvailable(wn.get_task_node(a1)), true);
  assert.equal(isAvailable(wn.get_task_node(a2)), true);
});

test('toggle_complete flips status; add_to_inbox lands under the Inbox project', async () => {
  setOnline(true);
  const wn = track(new WhatsNext({ store: freshStore(), server: new MockServer() }));
  await wn.init();
  await tick();

  const uid = wn.add_to_inbox('Captured thing');
  await tick();
  const node = wn.get_task_node(uid);
  assert.equal(node.parent?.label, '__inbox__');
  assert.equal(node.isProject, false);

  assert.equal(node.status, 'Active');
  wn.toggle_complete(uid);
  await tick();
  assert.equal(node.status, 'Completed');
  wn.toggle_complete(uid);
  await tick();
  assert.equal(node.status, 'Active');
});
