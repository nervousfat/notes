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

