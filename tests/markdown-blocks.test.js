import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

test('renderMarkdown converts headings lists and rules', () => {
  assert.equal(core.renderMarkdown('# 标题'), '<h1>标题</h1>');
  assert.equal(core.renderMarkdown('### 三级'), '<h3>三级</h3>');
  assert.equal(core.renderMarkdown('- 一\n- 二'), '<ul>\n<li>一</li>\n<li>二</li>\n</ul>');
  assert.equal(core.renderMarkdown('---'), '<hr>');
});
