// Helper to convert UUID to numeric ID (consistent hash)
export const uuidToNumber = (uuid: string): number => {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % 1000000;
};

// Helper to find item by ID (handles both string and number)
export const findById = <T extends { id: number }>(items: T[], id: string | number): T | undefined => {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  return items.find(item => item.id === numericId);
};

