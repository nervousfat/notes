import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { note, early, later } from './fixtures.js';

test('oversized Chinese exports fail while caller notes remain intact', () => {
  const rows = Array.from({ length: 10 }, (_, index) => note({ id: 'note-' + index, content: '记'.repeat(200000) }));
  const first = structuredClone(rows[0]);
  assert.throws(() => core.serializeNotebook(rows, later), /UTF-8/);
  assert.equal(rows.length, 10);
  assert.deepEqual(rows[0], first);
});

test('valid multibyte backups survive serialization parsing and revision changes', () => {
  const rows = Array.from({ length: 5 }, (_, index) => note({ id: 'note-' + index, content: '记'.repeat(200000), tags: ['中文'] }));
  const text = core.serializeNotebook(rows, later);
  assert.ok(new TextEncoder().encode(text).byteLength <= core.MAX_BACKUP_BYTES);
  assert.deepEqual(core.parseNotebook(text), rows);
  const adjusted = core.updateNote(note({ createdAt: later, updatedAt: later }), { title: '回拨后' }, early);
  assert.deepEqual(core.parseNotebook(core.serializeNotebook([adjusted], later)), [adjusted]);
});

test('the inclusive byte boundary counts multibyte metadata and trailing spaces', () => {
  const base = JSON.stringify({ version: 1, notes: [], ignored: '记' });
  const exact = base + ' '.repeat(core.MAX_BACKUP_BYTES - new TextEncoder().encode(base).byteLength);
  assert.equal(new TextEncoder().encode(exact).byteLength, core.MAX_BACKUP_BYTES);
  assert.deepEqual(core.parseNotebook(exact), []);
  assert.throws(() => core.parseNotebook(exact + ' '), /UTF-8/);
});
