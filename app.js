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

