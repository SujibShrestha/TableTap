import type { Prisma } from "../generated/prisma/index.js"; 

export const PAID_ORDER_STATUSES = ['CONFIRMED', 'PREPARING', 'READY', 'SERVED'] as const;

export function buildDateRangeFilter(from?: string, to?: string) {
  const filter: Prisma.DateTimeFilter = {};
  if (from) filter.gte = new Date(from);
  if (to) filter.lte = new Date(to);
  return Object.keys(filter).length > 0 ? filter : undefined;
}