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

