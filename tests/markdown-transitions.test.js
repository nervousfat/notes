import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { note, early, later } from './fixtures.js';

test('CRLF and CR source text render the same block structure as LF', () => {
  const source = '## Plan\n- first\n- second\n\nA paragraph\n> quote';
  const expected = core.renderMarkdown(source);
  assert.equal(core.renderMarkdown(source.replaceAll('\n', '\r\n')), expected);
  assert.equal(core.renderMarkdown(source.replaceAll('\n', '\r')), expected);
});

test('lists close before paragraphs and code blocks without leaking block state', () => {
  const source = '- first\nplain\n- second\n' + '\x60'.repeat(3) + '\ncode\n' + '\x60'.repeat(3) + '\n### End';
  const result = core.renderMarkdown(source);
  assert.equal(result, '<ul>\n<li>first</li>\n</ul>\n<p>plain</p>\n<ul>\n<li>second</li>\n</ul>\n<pre><code>code</code></pre>\n<h3>End</h3>');
  assert.equal(core.renderMarkdown(' \n\n'), '');
  assert.equal(core.renderMarkdown('#### Four'), '<p>#### Four</p>');
});

test('multiple code fences and inline formatting preserve ordinary writing', () => {
  const fence = '\x60'.repeat(3);
  const result = core.renderMarkdown(fence + '\none\n' + fence + '\n**middle**\n' + fence + '\ntwo\n' + fence);
  assert.equal(result, '<pre><code>one</code></pre>\n<p><strong>middle</strong></p>\n<pre><code>two</code></pre>');
});
