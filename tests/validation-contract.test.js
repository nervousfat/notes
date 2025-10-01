import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { note, early, later } from './fixtures.js';

test('import validation accepts exact capacities and strips unknown metadata', () => {
  const source = note({ id: 'x'.repeat(128), title: '题'.repeat(120), content: '文'.repeat(200000), tags: Array.from({ length: 12 }, (_, index) => ('t' + index).padEnd(32, 'x')), extra: 'drop' });
  const checked = core.validateNote(source);
  assert.equal(checked.id.length, 128);
  assert.equal(checked.content.length, 200000);
  assert.equal(checked.tags.length, 12);
  assert.equal(Object.hasOwn(checked, 'extra'), false);
  assert.notEqual(checked.tags, source.tags);
});

test('noncanonical timestamps and oversized imported fields are rejected', () => {
  for (const changes of [{ id: 'x'.repeat(129) }, { id: '   ' }, { title: 'x'.repeat(121) }, { tags: Array(13).fill('a') }, { tags: [1] }, { createdAt: '2025-06-01T10:00:00Z' }, { updatedAt: '2025-06-01T11:00:00.000+01:00' }]) assert.throws(() => core.validateNote(note(changes)));
  for (const value of [null, [], 'note']) assert.throws(() => core.validateNote(value));
  assert.equal(core.validateNote(note({ title: '   ' })).title, '未命名笔记');
});

test('clock-adjusted revisions remain valid without rewriting creation dates', () => {
  const future = note({ createdAt: later, updatedAt: later });
  const edited = core.updateNote(future, { content: 'saved' }, early);
  assert.deepEqual(core.validateNote(edited), edited);
  assert.equal(edited.createdAt, later);
});
