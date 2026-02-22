import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

test('normalizeTags folds case duplicates and mixed separators', () => {
  assert.deepEqual(core.normalizeTags(['Ideas', 'ideas', 'Work']), ['ideas', 'work']);
  assert.deepEqual(core.normalizeTags('写作, 灵感，周记'), ['写作', '灵感', '周记']);
  assert.deepEqual(core.normalizeTags('  '), []);
});
test('normalizeTags caps the list and truncates long tags', () => {
  const many = Array.from({ length: 15 }, (_, index) => 'tag' + index);
  assert.equal(core.normalizeTags(many).length, 12);
  assert.equal(core.normalizeTags(['x'.repeat(40)])[0].length, 32);
  const long = 'y'.repeat(40);
  assert.deepEqual(core.normalizeTags([long, long.slice(0, 32)]), ['y'.repeat(32)]);
});
