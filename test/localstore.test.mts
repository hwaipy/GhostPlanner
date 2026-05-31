import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshStore, createTaskRecord } from './helpers.mts';

test('LocalStore: putAction then allActions round-trips', async () => {
  const s = freshStore();
  const rec = createTaskRecord('a', { type: 'CreateTask', title: 'X', isProject: true, parent: null }, 1, 1);
  await s.putAction(rec);
  const all = await s.allActions();
  assert.equal(all.length, 1);
  assert.deepEqual(all[0], rec);
});

test('LocalStore: putActions bulk + put overwrites by uid', async () => {
  const s = freshStore();
  await s.putActions([
    createTaskRecord('a', { type: 'CreateTask', title: 'A', isProject: true, parent: null }, 1, 1),
    createTaskRecord('b', { type: 'CreateTask', title: 'B', isProject: true, parent: null }, 2, 2),
  ]);
  assert.equal((await s.allActions()).length, 2);
  // same uid overwrites (used to backfill seq)
  await s.putAction(createTaskRecord('a', { type: 'CreateTask', title: 'A', isProject: true, parent: null }, 9, 1));
  const all = await s.allActions();
  assert.equal(all.length, 2);
  assert.equal(all.find((r) => r.uid === 'a')!.seq, 9);
});

test('LocalStore: meta get default + set/get', async () => {
  const s = freshStore();
  assert.equal(await s.getMeta('lastSyncedSeq', 0), 0);
  await s.setMeta('lastSyncedSeq', 42);
  assert.equal(await s.getMeta('lastSyncedSeq', 0), 42);
});

test('LocalStore: distinct db names are isolated', async () => {
  const a = freshStore();
  const b = freshStore();
  await a.putAction(createTaskRecord('x', { type: 'CreateTask', title: 'X', isProject: true, parent: null }));
  assert.equal((await a.allActions()).length, 1);
  assert.equal((await b.allActions()).length, 0);
});
