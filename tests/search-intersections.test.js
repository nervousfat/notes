import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { note, early, later } from './fixtures.js';

test('tokens may match different fields but all tokens must match one note', () => {
  const rows = [note({ id: 'a', title: 'Project', content: 'deep focus', tags: ['work'], pinned: true }), note({ id: 'b', title: 'Project', content: 'focus', tags: ['workshop'] }), note({ id: 'c', title: 'other', content: 'deep', tags: ['work'], pinned: true })];
  const before = structuredClone(rows);
  assert.deepEqual(core.searchNotes(rows, ' PROJECT\tdeep\nWORK ').map(value => value.id), ['a']);
  assert.deepEqual(core.searchNotes(rows, '', { tag: 'WORK' }).map(value => value.id), ['a', 'c']);
  assert.deepEqual(core.searchNotes(rows, 'focus', { tag: 'work', pinnedOnly: true }).map(value => value.id), ['a']);
  assert.deepEqual(rows, before);
});

test('repeated query tokens and literal punctuation do not change matching semantics', () => {
  const rows = [note({ content: 'a.b [draft]' }), note({ id: 'b', content: 'axb final' })];
  assert.deepEqual(core.searchNotes(rows, 'a.b a.b').map(value => value.id), ['note-a']);
  assert.deepEqual(core.searchNotes(rows, '[draft]').map(value => value.id), ['note-a']);
  assert.deepEqual(core.searchNotes([], 'anything'), []);
});
