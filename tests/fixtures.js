export const early = '2025-06-01T10:00:00.000Z';
export const later = '2025-06-02T10:00:00.000Z';
export const note = (changes = {}) => ({ id: 'note-a', title: '第一篇', content: 'Hello 世界', tags: [], pinned: false, createdAt: early, updatedAt: early, ...changes });
