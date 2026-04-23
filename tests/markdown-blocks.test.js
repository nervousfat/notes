import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

test('renderMarkdown converts headings lists and rules', () => {
  assert.equal(core.renderMarkdown('# 标题'), '<h1>标题</h1>');
  assert.equal(core.renderMarkdown('### 三级'), '<h3>三级</h3>');
  assert.equal(core.renderMarkdown('- 一\n- 二'), '<ul>\n<li>一</li>\n<li>二</li>\n</ul>');
  assert.equal(core.renderMarkdown('---'), '<hr>');
});
test('renderMarkdown fences code and escapes its content', () => {
  assert.equal(core.renderMarkdown('```\n<script>alert(1)</script>\n```'), '<pre><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></pre>');
  assert.equal(core.renderMarkdown('> 引用'), '<blockquote>引用</blockquote>');
  assert.equal(core.renderMarkdown('a\n\n\nb'), '<p>a</p>\n<p>b</p>');
});
