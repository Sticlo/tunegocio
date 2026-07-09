export function sortCategories<T extends { order: number; heading: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.heading.localeCompare(b.heading, 'es', { sensitivity: 'base' });
  });
}

export function nextCategoryOrder(categories: { order: number }[]): number {
  if (!categories.length) return 0;
  return Math.max(...categories.map((category) => category.order)) + 1;
}
