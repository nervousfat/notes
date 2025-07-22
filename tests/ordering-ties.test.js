import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { note, early, later } from './fixtures.js';

test('equal timestamps use identifiers in both chronological modes', () => {
  const rows = Object.freeze([Object.freeze(note({ id: 'z' })), Object.freeze(note({ id: 'a' })), Object.freeze(note({ id: 'm', pinned: true }))]);
  for (const mode of ['newest', 'oldest']) assert.deepEqual(core.sortNotes(rows, mode).map(value => value.id), ['m', 'a', 'z']);
  assert.deepEqual(rows.map(value => value.id), ['z', 'a', 'm']);
});

test('pinned priority is preserved in title ordering and unknown modes use newest', () => {
  const rows = [note({ id: 'a', title: 'A', updatedAt: later }), note({ id: 'p', title: 'Z', pinned: true }), note({ id: 'b', title: 'B' })];
  assert.deepEqual(core.sortNotes(rows, 'title').map(value => value.id), ['p', 'a', 'b']);
  assert.deepEqual(core.sortNotes(rows, 'unknown'), core.sortNotes(rows, 'newest'));
  assert.deepEqual(core.sortNotes(core.sortNotes(rows)), core.sortNotes(rows));
});
