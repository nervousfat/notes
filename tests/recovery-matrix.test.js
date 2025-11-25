import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import { note, early, later } from './fixtures.js';

test('all malformed recovery inputs preserve their exact source text', () => {
  for (const raw of ['', '  ', 'null', '[]', '{"version":2,"notes":[]}', '{"version":1,"notes":[{}]}']) {
    const recovered = core.recoverNotebook(raw);
    assert.equal(recovered.raw, raw);
    assert.equal(recovered.fresh, false);
    assert.deepEqual(recovered.notes, []);
    assert.ok(recovered.error);
  }
});

test('first use and an intentionally empty backup remain distinct across calls', () => {
  const first = core.recoverNotebook(undefined);
  assert.equal(first.fresh, true);
  assert.equal(first.raw, null);
  const empty = core.recoverNotebook(core.serializeNotebook([], later));
  assert.deepEqual(empty, { notes: [], error: null, fresh: false, raw: null });
  first.notes[0].content = 'local edit';
  assert.notEqual(core.recoverNotebook(undefined).notes[0].content, 'local edit');
});
