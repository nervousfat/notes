import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

test('renderInline formats code bold and emphasis', () => {
  assert.equal(core.renderInline('`const x = 1;`'), '<code>const x = 1;</code>');
  assert.equal(core.renderInline('**重点**'), '<strong>重点</strong>');
  assert.equal(core.renderInline('*轻*'), '<em>轻</em>');
});
test('renderInline only links safe protocols', () => {
  assert.equal(core.renderInline('[官网](https://example.com)'), '<a href="https://example.com" target="_blank" rel="noopener noreferrer">官网</a>');
  assert.equal(core.renderInline('[危险](javascript:alert(1))'), '危险)');
  assert.equal(core.renderInline('a < b'), 'a &lt; b');
});
