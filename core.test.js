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

