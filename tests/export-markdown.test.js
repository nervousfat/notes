import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

test('exportMarkdown writes titled markdown with tags', () => {
  const note = { title: '周末计划', tags: ['生活'], content: '- 逛书店' };
  const result = core.exportMarkdown(note);
  assert.equal(result.filename, '周末计划.md');
  assert.equal(result.content, '# 周末计划\n\n标签：生活\n\n- 逛书店\n');
});
