export const MAX_BACKUP_BYTES = 5_000_000;

function assertBackupSize(raw) {
  if (typeof raw !== 'string' || raw.length > MAX_BACKUP_BYTES || new TextEncoder().encode(raw).byteLength > MAX_BACKUP_BYTES) {
    throw new Error('文件必须是最多 5 MB 的 JSON 文本（UTF-8 字节）');
  }
}

function nextRevisionTime(note, now) {
  const current = Date.parse(now);
  const created = Date.parse(note.createdAt);
  const previous = Date.parse(note.updatedAt);
  if (typeof now !== 'string' || !Number.isFinite(current) || new Date(current).toISOString() !== now || !Number.isFinite(created) || !Number.isFinite(previous)) {
    throw new Error('修订时间必须为有效的标准 ISO 格式');
  }
  const timestamp = Math.max(current, created, previous + 1);
  if (timestamp > 8_640_000_000_000_000) throw new Error('修订时间超出可表示范围');
  return new Date(timestamp).toISOString();
}

export function normalizeTags(value) {
  const list = Array.isArray(value) ? value : String(value || '').split(/[,，]/);
  const tags = [];
  for (const item of list) {
    const tag = String(item).trim().toLocaleLowerCase().slice(0, 32);
    if (!tag || tags.includes(tag)) continue;
    tags.push(tag);
    if (tags.length === 12) break;
  }
  return tags;
}

export function createNote(values = {}, now = new Date().toISOString()) {
  const random = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  return {
    id: String(values.id || random),
    title: String(values.title || '').trim().slice(0, 120) || '未命名笔记',
    content: String(values.content || '').slice(0, 200000),
    tags: normalizeTags(values.tags),
    pinned: Boolean(values.pinned),
    createdAt: now,
    updatedAt: now,
  };
}

export function updateNote(note, patch, now = new Date().toISOString()) {
  const next = { ...note, updatedAt: nextRevisionTime(note, now) };
  if (Object.hasOwn(patch, 'title')) {
    next.title = String(patch.title).trim().slice(0, 120) || '未命名笔记';
  }
  if (Object.hasOwn(patch, 'content')) {
    next.content = String(patch.content).slice(0, 200000);
  }
  if (Object.hasOwn(patch, 'tags')) next.tags = normalizeTags(patch.tags);
  if (Object.hasOwn(patch, 'pinned')) next.pinned = Boolean(patch.pinned);
  return next;
}

export function removeNote(notes, id) {
  const index = notes.findIndex((note) => note.id === id);
  if (index === -1) return notes.slice();
  const remaining = [];
  for (let position = 0; position < notes.length; position += 1) {
    if (position === index) continue;
    remaining.push(notes[position]);
  }
  return remaining;
}

export function togglePin(note, now = new Date().toISOString()) {
  const next = {
    ...note,
    tags: note.tags.slice(),
    pinned: !note.pinned,
    updatedAt: nextRevisionTime(note, now),
  };
  return next;
}

export function searchNotes(notes, query = '', options = {}) {
  const tokens = String(query).trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const tag = String(options.tag || '').toLocaleLowerCase();
  return notes.filter((note) => {
    if (options.pinnedOnly && !note.pinned) return false;
    if (tag && !note.tags.includes(tag)) return false;
    const searchable = [note.title, note.content, ...note.tags].join(' ').toLocaleLowerCase();
    return tokens.every((token) => searchable.includes(token));
  });
}

export function sortNotes(notes, mode = 'newest') {
  return notes.slice().sort((left, right) => {
    if (left.pinned !== right.pinned) return Number(right.pinned) - Number(left.pinned);
    if (mode === 'title') {
      return left.title.localeCompare(right.title, 'zh-CN');
    }
    const difference = Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
    if (difference === 0) return left.id.localeCompare(right.id);
    return mode === 'oldest' ? -difference : difference;
  });
}

export function countWords(content) {
  const text = String(content || '');
  const hanCharacters = text.match(/\p{Script=Han}/gu) || [];
  const withoutHan = text.replace(/\p{Script=Han}/gu, ' ');
  const otherWords = withoutHan.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || [];
  const words = hanCharacters.length + otherWords.length;
  const characters = Array.from(text).filter((character) => !/\s/u.test(character)).length;
  return { words, characters };
}

export function notebookStats(notes) {
  const tags = new Set();
  let words = 0;
  let characters = 0;
  for (const note of notes) {
    const counted = countWords(note.content);
    words += counted.words;
    characters += counted.characters;
    note.tags.forEach((tag) => tags.add(tag));
  }
  return { notes: notes.length, pinned: notes.filter((note) => note.pinned).length, tags: tags.size, words, characters };
}

export function escapeHTML(value) {
  const entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return String(value).replace(/[&<>"']/g, (character) => entities[character]);
}

export function safeLink(value) {
  const candidate = String(value).trim();
  try {
    const parsed = new URL(candidate);
    if (!['https:', 'http:', 'mailto:'].includes(parsed.protocol)) return null;
    if (parsed.protocol === 'mailto:' && !parsed.pathname) return null;
    if (/[\u0000-\u0020]/.test(candidate)) return null;
    return candidate;
  } catch {
    return null;
  }
}

export function renderInline(value) {
  const source = String(value);
  const pattern = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\([^\s)]+\))/g;
  let output = '';
  let cursor = 0;
  for (const match of source.matchAll(pattern)) {
    output += escapeHTML(source.slice(cursor, match.index));
    const token = match[0];
    if (token.startsWith('`')) output += '<code>' + escapeHTML(token.slice(1, -1)) + '</code>';
    else if (token.startsWith('**')) output += '<strong>' + escapeHTML(token.slice(2, -2)) + '</strong>';
    else if (token.startsWith('*')) output += '<em>' + escapeHTML(token.slice(1, -1)) + '</em>';
    else {
      const link = /^\[([^\]]+)\]\((.+)\)$/.exec(token);
      const href = safeLink(link[2]);
      output += href ? '<a href="' + escapeHTML(href) + '" target="_blank" rel="noopener noreferrer">' + escapeHTML(link[1]) + '</a>' : escapeHTML(link[1]);
    }
    cursor = match.index + token.length;
  }
  return output + escapeHTML(source.slice(cursor));
}

export function renderMarkdown(content) {
  const lines = String(content).replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let code = null;
  let listOpen = false;
  const closeList = () => { if (listOpen) { blocks.push('</ul>'); listOpen = false; } };
  for (const line of lines) {
    if (/^```/.test(line)) {
      closeList();
      if (code === null) code = [];
      else { blocks.push('<pre><code>' + escapeHTML(code.join('\n')) + '</code></pre>'); code = null; }
      continue;
    }
    if (code !== null) { code.push(line); continue; }
    const bullet = /^\s*[-*] (.+)$/.exec(line);
    if (bullet) {
      if (!listOpen) { blocks.push('<ul>'); listOpen = true; }
      blocks.push('<li>' + renderInline(bullet[1]) + '</li>');
      continue;
    }
    closeList();
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) blocks.push('<h' + heading[1].length + '>' + renderInline(heading[2]) + '</h' + heading[1].length + '>');
    else if (/^>\s?/.test(line)) blocks.push('<blockquote>' + renderInline(line.replace(/^>\s?/, '')) + '</blockquote>');
    else if (/^---+$/.test(line.trim())) blocks.push('<hr>');
    else if (line.trim()) blocks.push('<p>' + renderInline(line) + '</p>');
  }
  closeList();
  if (code !== null) blocks.push('<pre><code>' + escapeHTML(code.join('\n')) + '</code></pre>');
  return blocks.join('\n');
}

export function validateNote(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('笔记必须是对象');
  if (typeof value.id !== 'string' || !value.id.trim() || value.id.length > 128) throw new Error('笔记编号无效');
  if (typeof value.title !== 'string' || value.title.length > 120) throw new Error('笔记标题无效');
  if (typeof value.content !== 'string' || value.content.length > 200000) throw new Error('笔记内容无效或过长');
  if (!Array.isArray(value.tags) || value.tags.length > 12 || value.tags.some((tag) => typeof tag !== 'string' || tag.length > 32)) throw new Error('笔记标签无效');
  if (typeof value.pinned !== 'boolean') throw new Error('置顶状态无效');
  if (typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt))) throw new Error('创建时间无效');
  if (typeof value.updatedAt !== 'string' || !Number.isFinite(Date.parse(value.updatedAt))) throw new Error('更新时间无效');
  if (new Date(value.createdAt).toISOString() !== value.createdAt || new Date(value.updatedAt).toISOString() !== value.updatedAt) throw new Error('时间必须为有效的标准 ISO 格式');
  if (Date.parse(value.updatedAt) < Date.parse(value.createdAt)) throw new Error('更新时间不能早于创建时间');
  return { id: value.id, title: value.title.trim() || '未命名笔记', content: value.content, tags: normalizeTags(value.tags), pinned: value.pinned, createdAt: value.createdAt, updatedAt: value.updatedAt };
}

export function parseNotebook(raw) {
  assertBackupSize(raw);
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new Error('JSON 格式无法识别'); }
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.notes)) throw new Error('不是支持的笔记备份格式');
  if (parsed.notes.length > 1000) throw new Error('笔记数量不能超过 1000');
  const notes = parsed.notes.map(validateNote);
  const unique = new Set(notes.map((note) => note.id));
  if (unique.size !== notes.length) throw new Error('备份中存在重复笔记编号');
  return notes;
}

export function serializeNotebook(notes, now = new Date().toISOString()) {
  if (!Array.isArray(notes) || notes.length > 1000) throw new Error('笔记数量不能超过 1000');
  const clean = notes.map(validateNote);
  const serialized = JSON.stringify({
    version: 1,
    exportedAt: now,
    notes: clean,
  }, null, 2);
  parseNotebook(serialized);
  return serialized;
}

export function mergeNotes(existing, incoming) {
  const merged = new Map(existing.map((note) => [note.id, validateNote(note)]));
  for (const value of incoming) {
    const note = validateNote(value);
    const previous = merged.get(note.id);
    if (!previous || Date.parse(note.updatedAt) > Date.parse(previous.updatedAt)) {
      merged.set(note.id, note);
    }
  }
  if (merged.size > 1000) throw new Error('合并后笔记数量超过 1000');
  return [...merged.values()];
}

export function exportMarkdown(note) {
  const title = note.title.replace(/[\r\n]/g, ' ');
  const tags = note.tags.length ? '\n标签：' + note.tags.join(' · ') + '\n' : '';
  const content = '# ' + title + '\n' + tags + '\n' + note.content + '\n';
  let basename = title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/[. ]+$/g, '').slice(0, 80);
  if (!basename) basename = 'note';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(basename)) basename = 'note-' + basename;
  const filename = basename + '.md';
  return { filename, content };
}

export function createSampleNotes() {
  const now = new Date().toISOString();
  const welcome = createNote({
    id: 'sample-welcome', title: '给想法一个安静的地方', pinned: true, tags: ['开始', '灵感'],
    content: '# 欢迎来到纸间\n这里是保存在本机浏览器的私人笔记本。\n\n- 写下突然出现的灵感\n- 用标签整理日常记录\n- 导出 JSON 备份，也可单独导出 Markdown\n\n> 先记录，再慢慢整理。\n\n支持 **粗体**、*斜体*、`代码` 和 [Markdown 指南](https://www.markdownguide.org/)。',
  }, now);
  const second = createNote({ id: 'sample-weekend', title: '周末的小计划', tags: ['生活'], content: '# 让周末慢一点\n- 逛一次书店\n- 做一顿喜欢的早餐\n- 在公园走三十分钟\n\n## 随手记\n把值得记住的小事写在这里。' }, now);
  return [welcome, second];
}

export function recoverNotebook(raw) {
  if (raw === null || raw === undefined) {
    return { notes: createSampleNotes(), error: null, fresh: true, raw: null };
  }
  try {
    const notes = parseNotebook(raw);
    return { notes, error: null, fresh: false, raw: null };
  } catch (error) {
    return { notes: [], error: error.message, fresh: false, raw };
  }
}

