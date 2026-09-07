import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

test('togglePin flips state and bumps revision time', () => {
  const note = { id: 'n1', title: 'T', content: '', tags: ['keep'], pinned: false, createdAt: '2026-09-01T08:00:00.000Z', updatedAt: '2026-09-01T08:00:00.000Z' };
  const pinned = core.togglePin(note, '2026-09-02T08:00:00.000Z');
  assert.equal(pinned.pinned, true);
  assert.equal(pinned.updatedAt, '2026-09-02T08:00:00.000Z');
  assert.deepEqual(pinned.tags, ['keep']);
  assert.equal(note.pinned, false);
});
test('togglePin round-trips back to unpinned', () => {
  const note = { id: 'n1', title: 'T', content: '', tags: [], pinned: false, createdAt: '2026-09-01T08:00:00.000Z', updatedAt: '2026-09-01T08:00:00.000Z' };
  const round = core.togglePin(core.togglePin(note, '2026-09-02T08:00:00.000Z'), '2026-09-03T08:00:00.000Z');
  assert.equal(round.pinned, false);
  assert.equal(round.updatedAt, '2026-09-03T08:00:00.000Z');
});
