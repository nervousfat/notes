import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const note = (fields = {}) => ({ id: 'n1', title: 'T', content: '', tags: [], pinned: false, createdAt: '2026-07-01T08:00:00.000Z', updatedAt: '2026-07-01T08:00:00.000Z', ...fields });

test('searchNotes requires every token to match somewhere', () => {
  const notes = [
    note({ id: 'a', title: '周记', content: '公园散步' }),
    note({ id: 'b', title: '读书笔记', content: '公园' }),
    note({ id: 'c', title: '工作', content: '' })
  ];
  assert.deepEqual(core.searchNotes(notes, '公园').map(item => item.id), ['a', 'b']);
  assert.deepEqual(core.searchNotes(notes, '公园 周记').map(item => item.id), ['a']);
});
test('searchNotes narrows by tag and pinned filters', () => {
  const notes = [
    note({ id: 'a', tags: ['生活'], pinned: true }),
    note({ id: 'b', tags: ['生活'] }),
    note({ id: 'c', tags: ['工作'] })
  ];
  assert.deepEqual(core.searchNotes(notes, '', { tag: '生活' }).map(item => item.id), ['a', 'b']);
  assert.deepEqual(core.searchNotes(notes, '', { pinnedOnly: true }).map(item => item.id), ['a']);
});
