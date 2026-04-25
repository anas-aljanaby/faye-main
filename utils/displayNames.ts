export function formatListDisplayName(name: string, maxParts = 2): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length > maxParts) {
    return parts.slice(0, maxParts).join(' ');
  }

  return parts.join(' ') || name;
}
