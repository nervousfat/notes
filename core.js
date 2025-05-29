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
  const next = { ...note, updatedAt: now };
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

