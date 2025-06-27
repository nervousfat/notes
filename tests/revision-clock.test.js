import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { note, early, later } from './fixtures.js';

test('clock rollback keeps creation time and advances the last revision', () => {
  const original = Object.freeze(note({ createdAt: later, updatedAt: later }));
  const edited = core.updateNote(original, { content: 'new' }, early);
  assert.equal(edited.createdAt, later);
  assert.equal(edited.updatedAt, '2025-06-02T10:00:00.001Z');
  const pinned = core.togglePin(edited, early);
  assert.equal(pinned.updatedAt, '2025-06-02T10:00:00.002Z');
  assert.equal(original.content, 'Hello 世界');
  assert.equal(original.updatedAt, later);
});

test('forward wall-clock time is retained and equal-time edits still get a new revision', () => {
  const first = core.updateNote(note(), { title: 'changed' }, later);
  assert.equal(first.updatedAt, later);
  const next = core.updateNote(first, { content: 'second' }, later);
  assert.ok(Date.parse(next.updatedAt) > Date.parse(first.updatedAt));
  assert.equal(next.createdAt, early);
});

test('unrepresentable or noncanonical revision times fail without mutating input', () => {
  const original = note();
  const before = structuredClone(original);
  for (const invalid of ['not-a-date', '2025-06-01', '2025-06-01T10:00:00Z', 1, null]) {
    assert.throws(() => core.updateNote(original, { title: 'new' }, invalid), /时间/);
    assert.throws(() => core.togglePin(original, invalid), /时间/);
  }
  assert.throws(() => core.togglePin(note({ updatedAt: '+275760-09-13T00:00:00.000Z' }), later), /范围/);
  assert.deepEqual(original, before);
});
