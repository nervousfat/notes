import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const note = (fields = {}) => ({ id: 'n1', title: 'T', content: '', tags: [], pinned: false, createdAt: '2026-06-01T08:00:00.000Z', updatedAt: '2026-06-01T08:00:00.000Z', ...fields });

test('sortNotes floats pinned notes above the rest', () => {
  const notes = [note({ id: 'a' }), note({ id: 'b', pinned: true }), note({ id: 'c' })];
  assert.deepEqual(core.sortNotes(notes).map(item => item.id), ['b', 'a', 'c']);
});
