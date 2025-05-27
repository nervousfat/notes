import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { note, early, later } from './fixtures.js';

test('fresh notes do not share tags or content state', () => {
  const first = core.createNote({}, early);
  const second = core.createNote({}, early);
  assert.notEqual(first.id, second.id);
  first.tags.push('local');
  first.content = 'edited';
  assert.deepEqual(second.tags, []);
  assert.equal(second.content, '');
  assert.equal(second.createdAt, second.updatedAt);
});

test('interactive creation bounds title and body without modifying supplied values', () => {
  const source = Object.freeze({ id: 'custom-id', title: ' T'.repeat(100), content: '字'.repeat(200001), tags: Object.freeze(['A', 'a']) });
  const created = core.createNote(source, early);
  assert.equal(created.id, 'custom-id');
  assert.equal(created.title.length, 120);
  assert.equal(created.content.length, 200000);
  assert.deepEqual(created.tags, ['a']);
  assert.equal(source.content.length, 200001);
  assert.equal(core.createNote({ title: '   ' }, early).title, '未命名笔记');
});
