import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

test('normalizeTags folds case duplicates and mixed separators', () => {
  assert.deepEqual(core.normalizeTags(['Ideas', 'ideas', 'Work']), ['ideas', 'work']);
  assert.deepEqual(core.normalizeTags('写作, 灵感，周记'), ['写作', '灵感', '周记']);
  assert.deepEqual(core.normalizeTags('  '), []);
});
