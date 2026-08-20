import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const note = (fields = {}) => ({ id: 'n1', title: 'T', content: '', tags: [], pinned: false, createdAt: '2026-08-01T08:00:00.000Z', updatedAt: '2026-08-01T08:00:00.000Z', ...fields });

test('notebookStats aggregates notes tags and volume', () => {
  const notes = [
    note({ content: '你好', tags: ['a'] }),
    note({ content: 'hello', tags: ['a', 'b'], pinned: true })
  ];
  const stats = core.notebookStats(notes);
  assert.equal(stats.notes, 2);
  assert.equal(stats.pinned, 1);
  assert.equal(stats.tags, 2);
  assert.equal(stats.words, 3);
  assert.equal(stats.characters, 7);
});
