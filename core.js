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

