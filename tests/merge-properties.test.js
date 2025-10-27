import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { note, early, later } from './fixtures.js';

test('equal revision times keep the existing content and repeated imports are idempotent', () => {
  const current = note({ content: 'local' });
  const tied = note({ content: 'incoming' });
  const extra = note({ id: 'other', content: 'new' });
  const merged = core.mergeNotes([current], [tied, extra]);
  assert.equal(merged[0].content, 'local');
  assert.deepEqual(core.mergeNotes(merged, [tied, extra]), merged);
  assert.equal(current.content, 'local');
  assert.equal(tied.content, 'incoming');
});

test('incoming versions can arrive out of order and the newest wins', () => {
  const oldest = note({ content: 'old' });
  const middle = core.updateNote(oldest, { content: 'middle' }, later);
  const newest = core.updateNote(middle, { content: 'newest' }, later);
  assert.deepEqual(core.mergeNotes([], [newest, oldest, middle]), [newest]);
  assert.deepEqual(core.mergeNotes([oldest], [middle, newest]), [newest]);
  const before = structuredClone(oldest);
  assert.throws(() => core.mergeNotes([oldest], [{ ...newest, pinned: 'invalid' }]));
  assert.deepEqual(oldest, before);
});
