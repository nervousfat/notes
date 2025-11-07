import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { note, early, later } from './fixtures.js';

test('all Windows numbered device names are prefixed case-insensitively', () => {
  for (let index = 1; index <= 9; index += 1) {
    for (const prefix of ['CoM', 'lPt']) {
      const title = prefix + index;
      assert.equal(core.exportMarkdown(note({ title })).filename, 'note-' + title + '.md');
    }
  }
  assert.equal(core.exportMarkdown(note({ title: 'COM10' })).filename, 'COM10.md');
  assert.equal(core.exportMarkdown(note({ title: 'auxiliary' })).filename, 'auxiliary.md');
});

test('export separates title cleanup from body and tag preservation', () => {
  const original = note({ title: 'Plan\r\nDraft', content: 'line one\nline two', tags: ['work', '生活'] });
  const before = structuredClone(original);
  const result = core.exportMarkdown(original);
  assert.equal(result.filename, 'Plan  Draft.md');
  assert.equal(result.content, '# Plan  Draft\n\n标签：work · 生活\n\nline one\nline two\n');
  assert.deepEqual(original, before);
  assert.equal(core.exportMarkdown(note({ title: '文'.repeat(100) })).filename, '文'.repeat(80) + '.md');
});
