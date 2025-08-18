import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { note, early, later } from './fixtures.js';

test('Han extension characters emoji and joined Latin words have explicit counts', () => {
  assert.deepEqual(core.countWords('𠀀中😀'), { words: 2, characters: 3 });
  assert.deepEqual(core.countWords('re-enter don’t 2025'), { words: 3, characters: 17 });
  assert.deepEqual(core.countWords(' \t\n'), { words: 0, characters: 0 });
  assert.deepEqual(core.countWords('😀😀'), { words: 0, characters: 2 });
});

test('notebook statistics equal per-note totals and count distinct tags once', () => {
  const rows = [note({ content: '𠀀中😀', tags: ['one'], pinned: true }), note({ id: 'b', content: 'Hello world', tags: ['one', 'two'] })];
  const counts = rows.map(value => core.countWords(value.content));
  const stats = core.notebookStats(rows);
  assert.equal(stats.words, counts.reduce((sum, value) => sum + value.words, 0));
  assert.equal(stats.characters, counts.reduce((sum, value) => sum + value.characters, 0));
  assert.deepEqual({ notes: stats.notes, tags: stats.tags, pinned: stats.pinned }, { notes: 2, tags: 2, pinned: 1 });
  assert.deepEqual(core.notebookStats([]), { notes: 0, pinned: 0, tags: 0, words: 0, characters: 0 });
});
