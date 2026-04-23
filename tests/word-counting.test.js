import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

test('countWords counts Han characters individually', () => {
  const stats = core.countWords('你好世界');
  assert.equal(stats.words, 4);
  assert.equal(stats.characters, 4);
});

test('countWords treats Latin runs as single words', () => {
  const stats = core.countWords('hello world');
  assert.equal(stats.words, 2);
  assert.equal(stats.characters, 10);
});
test('countWords ignores whitespace between words', () => {
  const stats = core.countWords('你好\n\t世界 end');
  assert.equal(stats.words, 5);
  assert.equal(stats.characters, 7);
});
