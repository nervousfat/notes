import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

test('updateNote bumps revision time to the edit moment', () => {
  const note = core.createNote({ id: 'n1' }, '2026-05-01T08:00:00.000Z');
  const next = core.updateNote(note, { title: '新标题' }, '2026-05-02T09:00:00.000Z');
  assert.equal(next.title, '新标题');
  assert.equal(next.updatedAt, '2026-05-02T09:00:00.000Z');
  assert.equal(next.createdAt, '2026-05-01T08:00:00.000Z');
});
