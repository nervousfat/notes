// phase: storage and session state
import * as core from './core.js';
const STORAGE_KEY = 'paperspace.notes.v1';
const $ = (id) => document.getElementById(id);
let loaded;
try { loaded = core.recoverNotebook(localStorage.getItem(STORAGE_KEY)); }
catch { loaded = { notes: [], error: '浏览器暂时禁止访问本地存储', raw: null }; }
let notes = loaded.notes;
let selectedId = core.sortNotes(notes)[0]?.id || null;
let previewMode = false;
let saveTimer;
let toastTimer;
let saveBlocked = Boolean(loaded.error);
let recoveryRaw = loaded.raw;
const currentNote = () => notes.find((note) => note.id === selectedId);
function announce(message) {
  clearTimeout(toastTimer);
  $('status').textContent = message;
  $('status').hidden = false;
  toastTimer = setTimeout(() => { $('status').hidden = true; }, 4000);
}
function persist() {
  clearTimeout(saveTimer);
  if (saveBlocked) { $('save-state').textContent = '仅在内存中，请先备份'; return false; }
  try {
    localStorage.setItem(STORAGE_KEY, core.serializeNotebook(notes));
    $('save-state').textContent = '已保存到本机';
    return true;
  } catch (error) {
    $('save-state').textContent = '保存失败，请导出备份';
    announce('本地保存失败：' + error.message + '。当前内容仍在页面中，请导出备份。');
    return false;
  }
}
function scheduleSave() {
  clearTimeout(saveTimer);
  $('save-state').textContent = saveBlocked ? '仅在内存中，请先备份' : '正在保存…';
  saveTimer = setTimeout(persist, 350);
}

// phase: library rendering and filters
function renderList() {
  const shown = core.sortNotes(core.searchNotes(notes, $('search').value, {
    tag: $('tag-filter').value,
    pinnedOnly: $('pinned-only').checked,
  }), $('sort-order').value);
  $('result-count').textContent = shown.length;
  $('note-list').replaceChildren();
  for (const note of shown) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'note-item';
    button.dataset.noteId = note.id;
    button.setAttribute('aria-pressed', String(note.id === selectedId));
    const title = document.createElement('strong');
    title.textContent = (note.pinned ? '⌑ ' : '') + note.title;
    const excerpt = document.createElement('span');
    excerpt.className = 'note-excerpt';
    excerpt.textContent = note.content.replace(/[#*`>\n]/g, ' ').trim().slice(0, 68) || '还没有正文，开始书写吧。';
    const meta = document.createElement('span');
    meta.className = 'note-meta';
    const tags = document.createElement('span');
    tags.className = 'note-tag';
    tags.textContent = note.tags.length ? '# ' + note.tags.join(' · ') : '无标签';
    const date = document.createElement('time');
    date.dateTime = note.updatedAt;
    date.textContent = new Date(note.updatedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    meta.append(tags, date);
    button.append(title, excerpt, meta);
    button.addEventListener('click', () => { persist(); selectedId = note.id; renderList(); renderEditor(); });
    $('note-list').append(button);
  }
  if (!shown.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = notes.length ? '没有找到匹配的笔记，试试其他关键词。' : '你的第一篇笔记，从这里开始。';
    $('note-list').append(empty);
  }
}
function renderStats() {
  const stats = core.notebookStats(notes);
  $('stat-notes').textContent = stats.notes;
  $('stat-words').textContent = stats.words.toLocaleString('zh-CN');
  $('stat-tags').textContent = stats.tags;
  const selectedTag = $('tag-filter').value;
  $('tag-filter').replaceChildren(new Option('所有标签', ''));
  const tags = [...new Set(notes.flatMap((note) => note.tags))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  tags.forEach((tag) => $('tag-filter').append(new Option(tag, tag)));
  if (tags.includes(selectedTag)) $('tag-filter').value = selectedTag;
}

// phase: editor state and autosave
function renderEditorMeta() {
  const note = currentNote();
  if (!note) return;
  const counts = core.countWords(note.content);
  $('word-count').textContent = counts.words + ' 字 / 词 · ' + counts.characters + ' 字符';
  $('updated-at').textContent = '更新于 ' + new Date(note.updatedAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  $('pin-note').textContent = note.pinned ? '取消置顶' : '置顶';
  $('pin-note').setAttribute('aria-pressed', String(note.pinned));
  if (previewMode) $('preview').innerHTML = core.renderMarkdown(note.content) || '<p class="muted">还没有正文，切换到编辑开始书写。</p>';
}
function setMode(value) {
  previewMode = value;
  $('mode-edit').setAttribute('aria-pressed', String(!value));
  $('mode-preview').setAttribute('aria-pressed', String(value));
  $('writing-panel').hidden = value;
  $('preview').hidden = !value;
  renderEditorMeta();
}
function renderEditor() {
  const note = currentNote();
  $('editor-empty').hidden = Boolean(note);
  $('editor-panel').hidden = !note;
  if (!note) return;
  $('note-title').value = note.title;
  $('note-content').value = note.content;
  $('note-tags').value = note.tags.join(', ');
  setMode(previewMode);
}
function captureEdit(field, value) {
  const note = currentNote();
  if (!note) return;
  const next = core.updateNote(note, { [field]: value });
  notes = notes.map((item) => item.id === note.id ? next : item);
  renderStats();
  renderList();
  renderEditorMeta();
  scheduleSave();
}
function createNewNote() {
  if (notes.length >= 1000) { announce('笔记数量已达 1,000 篇，请先备份并整理。'); return; }
  persist();
  const note = core.createNote();
  notes.unshift(note);
  selectedId = note.id;
  $('search').value = '';
  $('tag-filter').value = '';
  $('pinned-only').checked = false;
  previewMode = false;
  renderStats(); renderList(); renderEditor(); persist();
  $('note-title').focus();
  $('note-title').select();
}

// phase: editing actions and accessible controls
$('new-note').addEventListener('click', createNewNote);
$('empty-create').addEventListener('click', createNewNote);
$('note-title').addEventListener('input', (event) => captureEdit('title', event.target.value));
$('note-content').addEventListener('input', (event) => captureEdit('content', event.target.value));
$('note-tags').addEventListener('input', (event) => captureEdit('tags', event.target.value));
$('search').addEventListener('input', renderList);
$('tag-filter').addEventListener('change', renderList);
$('sort-order').addEventListener('change', renderList);
$('pinned-only').addEventListener('change', renderList);
$('mode-edit').addEventListener('click', () => setMode(false));
$('mode-preview').addEventListener('click', () => setMode(true));
$('pin-note').addEventListener('click', () => {
  const note = currentNote();
  if (!note) return;
  notes = notes.map((item) => item.id === note.id ? core.togglePin(item) : item);
  renderList(); renderEditorMeta(); persist();
});
$('delete-note').addEventListener('click', () => {
  const note = currentNote();
  if (!note || !confirm('删除「' + note.title + '」？此操作无法撤销，建议先导出备份。')) return;
  notes = core.removeNote(notes, note.id);
  selectedId = core.sortNotes(notes)[0]?.id || null;
  renderStats(); renderList(); renderEditor(); persist();
  announce('笔记已删除');
});
window.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    if (persist()) announce('笔记已保存到本机');
  }
});
window.addEventListener('pagehide', () => { persist(); });

// phase: validated backup import and downloads
function download(filename, content, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('export-md').addEventListener('click', () => {
  const note = currentNote();
  if (!note) return;
  const exported = core.exportMarkdown(note);
  download(exported.filename, exported.content, 'text/markdown;charset=utf-8');
  announce('Markdown 导出已准备');
});
$('export-json').addEventListener('click', () => {
  try {
    download('paperspace-' + new Date().toISOString().slice(0, 10) + '.json', core.serializeNotebook(notes), 'application/json');
    announce('全部笔记备份已准备');
  } catch (error) { announce('导出失败：' + error.message); }
});
$('import-json').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 5000000) throw new Error('请选择小于 5 MB 的备份文件');
    const incoming = core.parseNotebook(await file.text());
    const merged = core.mergeNotes(notes, incoming);
    core.serializeNotebook(merged);
    notes = merged;
    selectedId = selectedId && notes.some((note) => note.id === selectedId) ? selectedId : notes[0]?.id || null;
    renderStats(); renderList(); renderEditor();
    const saved = persist();
    announce('已合并 ' + incoming.length + ' 篇笔记；同编号保留较新版本。' + (saved ? '' : '请导出备份，当前尚未保存到本机。'));
  } catch (error) { announce('导入失败：' + error.message); }
  finally { event.target.value = ''; }
});

