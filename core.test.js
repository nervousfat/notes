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

