import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

test('exportMarkdown strips filesystem-hostile characters', () => {
  const note = { title: 'a<b:c*d?', tags: [], content: '正文' };
  const result = core.exportMarkdown(note);
  assert.equal(result.filename, 'a-b-c-d-.md');
  assert.ok(result.content.startsWith('# a<b:c*d?\n'));
});
test('exportMarkdown guards Windows reserved names', () => {
  const reserved = { title: 'CON', tags: [], content: 'x' };
  assert.equal(core.exportMarkdown(reserved).filename, 'note-CON.md');
  const empty = { title: '', tags: [], content: 'x' };
  assert.equal(core.exportMarkdown(empty).filename, 'note.md');
  const tagged = { title: 'N', tags: ['a', 'b'], content: 'x' };
  assert.ok(core.exportMarkdown(tagged).content.includes('标签：a · b'));
});
