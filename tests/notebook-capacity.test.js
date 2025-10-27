import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { note, early, later } from './fixtures.js';

test('one thousand distinct notes fit and duplicate imports consume no capacity', () => {
  const rows = Array.from({ length: 1000 }, (_, index) => note({ id: 'note-' + index, content: '' }));
  const text = core.serializeNotebook(rows, later);
  assert.equal(core.parseNotebook(text).length, 1000);
  assert.equal(core.mergeNotes(rows, rows).length, 1000);
  const before = structuredClone(rows);
  assert.throws(() => core.mergeNotes(rows, [note({ id: 'overflow' })]), /1000/);
  assert.deepEqual(rows, before);
  assert.throws(() => core.serializeNotebook([...rows, note({ id: 'overflow' })], later), /1000/);
});

test('individually valid imports can exceed byte capacity after a pure merge', () => {
  const left = Array.from({ length: 5 }, (_, index) => note({ id: 'left-' + index, content: '字'.repeat(200000) }));
  const right = left.map((value, index) => ({ ...value, id: 'right-' + index }));
  assert.doesNotThrow(() => core.serializeNotebook(left, later));
  assert.doesNotThrow(() => core.serializeNotebook(right, later));
  const merged = core.mergeNotes(left, right);
  assert.throws(() => core.serializeNotebook(merged, later), /UTF-8/);
  assert.equal(left.length, 5);
  assert.equal(right.length, 5);
  assert.equal(merged.length, 10);
});
