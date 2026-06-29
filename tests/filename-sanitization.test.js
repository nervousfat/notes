import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

test('exportMarkdown strips filesystem-hostile characters', () => {
  const note = { title: 'a<b:c*d?', tags: [], content: '正文' };
  const result = core.exportMarkdown(note);
  assert.equal(result.filename, 'a-b-c-d-.md');
  assert.ok(result.content.startsWith('# a<b:c*d?\n'));
});
