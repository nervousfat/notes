import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from './core.js';
const early = '2025-06-01T10:00:00.000Z';
const late = '2026-06-01T10:00:00.000Z';
const note = (values = {}, time = early) => core.createNote({ id: 'note-1', title: '第一篇', content: 'Hello 世界', ...values }, time);

test('new notes have stable defaults and bounded text', () => {
  const empty = core.createNote({}, early);
  assert.ok(empty.id);
  assert.equal(empty.title, '未命名笔记');
  assert.deepEqual(empty.tags, []);
  assert.equal(empty.pinned, false);
  assert.equal(empty.createdAt, early);
  assert.equal(empty.updatedAt, early);
  assert.equal(note({ title: 'x'.repeat(150) }).title.length, 120);
});

test('tags normalize separators, duplicates and limits', () => {
  assert.deepEqual(core.normalizeTags(' Work, work，生活, ,IDEAS '), ['work', '生活', 'ideas']);
  assert.deepEqual(core.normalizeTags(undefined), []);
  assert.deepEqual(core.normalizeTags([' A ', 'a', 'b']), ['a', 'b']);
  const many = core.normalizeTags(Array.from({ length: 20 }, (_, index) => 'tag' + index));
  assert.equal(many.length, 12);
  assert.equal(many[0], 'tag0');
  assert.equal(many[11], 'tag11');
  assert.equal(core.normalizeTags(['a'.repeat(100)])[0].length, 32);
});

test('edits and pins preserve identity without mutating input', () => {
  const original = note({ tags: ['work'] });
  const edited = core.updateNote(original, { title: ' 更新 ', content: 'new', tags: 'A,b' }, late);
  assert.equal(edited.id, original.id);
  assert.equal(edited.createdAt, early);
  assert.equal(edited.updatedAt, late);
  assert.equal(original.title, '第一篇');
  assert.equal(edited.title, '更新');
  assert.deepEqual(edited.tags, ['a', 'b']);
  const pinned = core.togglePin(edited, late);
  assert.equal(pinned.pinned, true);
  assert.equal(edited.pinned, false);
});

test('deletion retains unrelated notes and tolerates absent identifiers', () => {
  const first = note();
  const second = note({ id: 'note-2' });
  const collection = [first, second];
  assert.deepEqual(core.removeNote(collection, 'note-1'), [second]);
  assert.deepEqual(core.removeNote(collection, 'missing'), collection);
  assert.notEqual(core.removeNote(collection, 'missing'), collection);
  assert.equal(collection.length, 2);
  assert.deepEqual(core.removeNote([], 'note-1'), []);
});

test('search combines full text tokens, tags and pinned filters', () => {
  const first = note({ title: 'Reading', content: 'Deep work', tags: ['study'], pinned: true });
  const second = note({ id: 'two', title: 'Work', content: 'shopping', tags: ['life'] });
  const notes = [first, second];
  assert.deepEqual(core.searchNotes(notes, 'READ study'), [first]);
  assert.equal(core.searchNotes(notes, 'work').length, 2);
  assert.deepEqual(core.searchNotes(notes, '', { tag: 'life' }), [second]);
  assert.deepEqual(core.searchNotes(notes, '', { pinnedOnly: true }), [first]);
  assert.deepEqual(core.searchNotes(notes, 'unknown'), []);
  assert.equal(core.searchNotes(notes, '   ').length, 2);
});

