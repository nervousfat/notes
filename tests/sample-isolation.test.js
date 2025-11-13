import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { note, early, later } from './fixtures.js';

test('sample factories create independent objects with valid complete metadata', () => {
  const first = core.createSampleNotes();
  const second = core.createSampleNotes();
  assert.equal(new Set(first.map(value => value.id)).size, first.length);
  for (const value of first) assert.deepEqual(core.validateNote(value), value);
  const untouched = structuredClone(second);
  first[0].tags.push('temporary');
  first[0].content = 'edited locally';
  assert.deepEqual(second, untouched);
  assert.deepEqual(core.parseNotebook(core.serializeNotebook(second)), second);
});

test('sample Markdown and portable downloads are usable without special treatment', () => {
  for (const value of core.createSampleNotes()) {
    assert.ok(core.renderMarkdown(value.content).length > 0);
    assert.ok(core.exportMarkdown(value).filename.endsWith('.md'));
    assert.equal(value.createdAt, value.updatedAt);
    assert.equal(typeof value.pinned, 'boolean');
  }
});
