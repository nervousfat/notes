import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { note, early, later } from './fixtures.js';

test('normalization is idempotent after truncation and case folding', () => {
  const values = ['  MIXED  ', 'mixed', '类'.repeat(40), '类'.repeat(32) + '其他', '', 'two words'];
  const tags = core.normalizeTags(values);
  assert.deepEqual(tags, ['mixed', '类'.repeat(32), 'two words']);
  assert.deepEqual(core.normalizeTags(tags), tags);
  assert.notEqual(core.normalizeTags(tags), tags);
  assert.deepEqual(values, ['  MIXED  ', 'mixed', '类'.repeat(40), '类'.repeat(32) + '其他', '', 'two words']);
});

test('duplicate source values do not consume distinct tag capacity', () => {
  const values = Array.from({ length: 30 }, (_, index) => 'tag-' + Math.floor(index / 2));
  const result = core.normalizeTags(values);
  assert.equal(result.length, 12);
  assert.equal(result.at(-1), 'tag-11');
  assert.deepEqual(core.normalizeTags('a，，b,,c'), ['a', 'b', 'c']);
});
