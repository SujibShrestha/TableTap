import { z } from 'zod';

export const createTableSchema = z.object({
  tableNumber: z.string().trim().min(1).max(20),
});

export const updateTableSchema = z.object({
  tableNumber: z.string().trim().min(1).max(20).optional(),
  isActive: z.boolean().optional(),
});