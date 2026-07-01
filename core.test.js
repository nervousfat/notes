import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from './core.js';
const early = '2025-06-01T10:00:00.000Z';
const late = '2026-06-01T10:00:00.000Z';
const note = (values = {}, time = early) => core.createNote({ id: 'note-1', title: '第一篇', content: 'Hello 世界', ...values }, time);

test('new notes have stable defaults and bounded text', () => {
  const empty = core.createNote({}, early);
  assert.ok(empty.id);
  assert.equal(empty.title, '未命名笔记');
  assert.deepEqual(empty.tags, []);
  assert.equal(empty.pinned, false);
  assert.equal(empty.createdAt, early);
  assert.equal(empty.updatedAt, early);
  assert.equal(note({ title: 'x'.repeat(150) }).title.length, 120);
});

test('tags normalize separators, duplicates and limits', () => {
  assert.deepEqual(core.normalizeTags(' Work, work，生活, ,IDEAS '), ['work', '生活', 'ideas']);
  assert.deepEqual(core.normalizeTags(undefined), []);
  assert.deepEqual(core.normalizeTags([' A ', 'a', 'b']), ['a', 'b']);
  const many = core.normalizeTags(Array.from({ length: 20 }, (_, index) => 'tag' + index));
  assert.equal(many.length, 12);
  assert.equal(many[0], 'tag0');
  assert.equal(many[11], 'tag11');
  assert.equal(core.normalizeTags(['a'.repeat(100)])[0].length, 32);
});

test('edits and pins preserve identity without mutating input', () => {
  const original = note({ tags: ['work'] });
  const edited = core.updateNote(original, { title: ' 更新 ', content: 'new', tags: 'A,b' }, late);
  assert.equal(edited.id, original.id);
  assert.equal(edited.createdAt, early);
  assert.equal(edited.updatedAt, late);
  assert.equal(original.title, '第一篇');
  assert.equal(edited.title, '更新');
  assert.deepEqual(edited.tags, ['a', 'b']);
  const pinned = core.togglePin(edited, late);
  assert.equal(pinned.pinned, true);
  assert.equal(edited.pinned, false);
});

test('deletion retains unrelated notes and tolerates absent identifiers', () => {
  const first = note();
  const second = note({ id: 'note-2' });
  const collection = [first, second];
  assert.deepEqual(core.removeNote(collection, 'note-1'), [second]);
  assert.deepEqual(core.removeNote(collection, 'missing'), collection);
  assert.notEqual(core.removeNote(collection, 'missing'), collection);
  assert.equal(collection.length, 2);
  assert.deepEqual(core.removeNote([], 'note-1'), []);
});

test('search combines full text tokens, tags and pinned filters', () => {
  const first = note({ title: 'Reading', content: 'Deep work', tags: ['study'], pinned: true });
  const second = note({ id: 'two', title: 'Work', content: 'shopping', tags: ['life'] });
  const notes = [first, second];
  assert.deepEqual(core.searchNotes(notes, 'READ study'), [first]);
  assert.equal(core.searchNotes(notes, 'work').length, 2);
  assert.deepEqual(core.searchNotes(notes, '', { tag: 'life' }), [second]);
  assert.deepEqual(core.searchNotes(notes, '', { pinnedOnly: true }), [first]);
  assert.deepEqual(core.searchNotes(notes, 'unknown'), []);
  assert.equal(core.searchNotes(notes, '   ').length, 2);
});

test('sorting prioritizes pins and supports newest oldest and title', () => {
  const a = note({ id: 'a', title: 'A' }, early);
  const b = note({ id: 'b', title: 'B' }, late);
  const pinned = note({ id: 'p', title: 'Z', pinned: true }, early);
  const notes = [a, pinned, b];
  assert.deepEqual(core.sortNotes(notes).map((item) => item.id), ['p', 'b', 'a']);
  assert.deepEqual(core.sortNotes(notes, 'oldest').map((item) => item.id), ['p', 'a', 'b']);
  assert.deepEqual(core.sortNotes(notes, 'title').map((item) => item.id), ['p', 'a', 'b']);
  assert.equal(notes[0].id, 'a');
  assert.deepEqual(core.sortNotes([]), []);
});

test('word and notebook statistics count Chinese and Latin content', () => {
  assert.deepEqual(core.countWords('Hello 世界'), { words: 3, characters: 7 });
  assert.deepEqual(core.countWords(''), { words: 0, characters: 0 });
  assert.equal(core.countWords("don't stop").words, 2);
  const notes = [note({ tags: ['a', 'b'], pinned: true }), note({ id: 'two', tags: ['b'], content: 'next' })];
  const stats = core.notebookStats(notes);
  assert.equal(stats.notes, 2);
  assert.equal(stats.pinned, 1);
  assert.equal(stats.tags, 2);
  assert.equal(stats.words, 4);
  assert.equal(stats.characters, 11);
});

test('HTML escaping neutralizes markup attributes and inline code', () => {
  assert.equal(core.escapeHTML('<img a="x">&'), '&lt;img a=&quot;x&quot;&gt;&amp;');
  const output = core.renderMarkdown('<script>alert(1)</script>');
  assert.ok(output.includes('&lt;script&gt;'));
  assert.ok(!output.includes('<script>'));
  assert.equal(core.renderInline('`<svg>`'), '<code>&lt;svg&gt;</code>');
  assert.equal(core.renderInline('**<b>**'), '<strong>&lt;b&gt;</strong>');
  assert.equal(core.renderInline('*fine*'), '<em>fine</em>');
  assert.equal(core.renderInline('plain & safe'), 'plain &amp; safe');
});

test('links allow explicit safe protocols and escape attributes', () => {
  assert.equal(core.safeLink('https://example.com'), 'https://example.com');
  assert.equal(core.safeLink('mailto:a@example.com'), 'mailto:a@example.com');
  assert.equal(core.safeLink('javascript:alert(1)'), null);
  assert.equal(core.safeLink('data:text/html,hi'), null);
  assert.equal(core.safeLink('//example.com'), null);
  assert.equal(core.safeLink('https://a.com/\nhi'), null);
  assert.ok(!core.renderInline('[bad](javascript:alert)').includes('<a'));
  assert.ok(core.renderInline('[good](https://example.com)').includes('rel="noopener noreferrer"'));
  assert.ok(core.renderInline('[x](https://x.test/"onmouseover="a)').includes('&quot;'));
});

test('Markdown blocks produce headings lists quotations and safe fences', () => {
  const rendered = core.renderMarkdown('# Heading\n- one\n- two\n\n> quote\n---\n```js\n<img>\n```');
  assert.ok(rendered.includes('<h1>Heading</h1>'));
  assert.ok(rendered.includes('<ul>'));
  assert.ok(rendered.includes('<li>two</li>'));
  assert.ok(rendered.includes('</ul>'));
  assert.ok(rendered.includes('<blockquote>quote</blockquote>'));
  assert.ok(rendered.includes('<hr>'));
  assert.ok(rendered.includes('<pre><code>&lt;img&gt;</code></pre>'));
  assert.equal(core.renderMarkdown('```\nunclosed'), '<pre><code>unclosed</code></pre>');
});

test('malformed imports reject shapes oversized fields and duplicates', () => {
  assert.throws(() => core.parseNotebook('{oops'), /JSON/);
  assert.throws(() => core.parseNotebook('[]'), /格式/);
  const wrap = (notes) => JSON.stringify({ version: 1, notes });
  assert.throws(() => core.parseNotebook(wrap([note({ id: 'x' }), note({ id: 'x' })])), /重复/);
  assert.throws(() => core.parseNotebook(wrap([{ ...note(), pinned: 'yes' }])), /置顶/);
  assert.throws(() => core.parseNotebook(wrap([{ ...note(), updatedAt: 'no-date' }])), /时间/);
  assert.throws(() => core.parseNotebook(wrap([{ ...note(), updatedAt: '2026-02-30T10:00:00.000Z' }])), /时间/);
  assert.throws(() => core.parseNotebook(wrap([{ ...note(), updatedAt: '2024-06-01T10:00:00.000Z' }])), /早于/);
  assert.throws(() => core.parseNotebook(wrap([{ ...note(), tags: ['a'.repeat(40)] }])), /标签/);
  assert.throws(() => core.parseNotebook(wrap([{ ...note(), content: 'a'.repeat(200001) }])), /内容/);
  assert.throws(() => core.parseNotebook(' '.repeat(5000001)), /5 MB/);
});

test('backup round trips and Markdown filenames are portable', () => {
  const original = note({ title: 'A/B:C', content: '# body', tags: ['work'] });
  const encoded = core.serializeNotebook([original], late);
  assert.deepEqual(core.parseNotebook(encoded), [original]);
  assert.equal(JSON.parse(encoded).exportedAt, late);
  assert.equal(core.exportMarkdown(original).filename, 'A-B-C.md');
  assert.ok(core.exportMarkdown(original).content.includes('# A/B:C'));
  assert.ok(core.exportMarkdown(original).content.includes('标签：work'));
  assert.equal(core.exportMarkdown(note({ title: 'CON' })).filename, 'note-CON.md');
  assert.equal(core.exportMarkdown(note({ title: 'CON.foo' })).filename, 'note-CON.foo.md');
  assert.equal(core.exportMarkdown(note({ title: '...' })).filename, 'note.md');
});

test('import merging keeps the newest version and adds new identifiers', () => {
  const existing = note({ content: 'old' }, early);
  const fresh = core.updateNote(existing, { content: 'new' }, late);
  const second = note({ id: 'two' });
  assert.deepEqual(core.mergeNotes([existing], [fresh, second]), [fresh, second]);
  assert.deepEqual(core.mergeNotes([fresh], [existing]), [fresh]);
  assert.equal(existing.content, 'old');
  assert.deepEqual(core.mergeNotes([], [second]), [second]);
  assert.deepEqual(core.mergeNotes([existing], []), [existing]);
  assert.throws(() => core.mergeNotes([], [{ nope: true }]), /编号/);
});

test('recovery preserves corrupted text and does not reseed an empty notebook', () => {
  const first = core.recoverNotebook(null);
  assert.equal(first.fresh, true);
  assert.ok(first.notes.length >= 2);
  assert.equal(new Set(first.notes.map((item) => item.id)).size, first.notes.length);
  const empty = core.recoverNotebook(core.serializeNotebook([]));
  assert.deepEqual(empty.notes, []);
  assert.equal(empty.fresh, false);
  const corrupt = core.recoverNotebook('broken');
  assert.equal(corrupt.raw, 'broken');
  assert.deepEqual(corrupt.notes, []);
  assert.ok(corrupt.error);
});

