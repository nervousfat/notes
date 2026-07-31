import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const note = (fields = {}) => ({ id: 'n1', title: 'T', content: '', tags: [], pinned: false, createdAt: '2026-07-02T08:00:00.000Z', updatedAt: '2026-07-02T08:00:00.000Z', ...fields });

test('mergeNotes keeps the newest revision per identifier', () => {
  const existing = [note({ id: 'a', content: '旧' })];
  const incoming = [note({ id: 'a', content: '新', updatedAt: '2026-07-03T08:00:00.000Z' })];
  const merged = core.mergeNotes(existing, incoming);
  assert.equal(merged.find(item => item.id === 'a').content, '新');
});
