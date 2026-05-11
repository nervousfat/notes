import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

test('renderInline formats code bold and emphasis', () => {
  assert.equal(core.renderInline('`const x = 1;`'), '<code>const x = 1;</code>');
  assert.equal(core.renderInline('**重点**'), '<strong>重点</strong>');
  assert.equal(core.renderInline('*轻*'), '<em>轻</em>');
});
