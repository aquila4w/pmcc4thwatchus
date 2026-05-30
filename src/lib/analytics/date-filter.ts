/**
 * Build a MongoDB $match date condition from optional from/to strings.
 * Returns an object to spread into a $match stage.
 */
export function buildDateMatch(field: string, from?: string | null, to?: string | null): Record<string, unknown> {
  const dateFilter: Record<string, unknown> = {};
  if (from || to) {
    const conditions: Record<string, unknown> = {};
    if (from) conditions.$gte = new Date(from);
    if (to) conditions.$lte = new Date(to);
    dateFilter[field] = conditions;
  }
  return dateFilter;
}
