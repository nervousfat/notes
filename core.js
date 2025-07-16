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

