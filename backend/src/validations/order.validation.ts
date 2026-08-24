import { z } from 'zod';

export const createOrderSchema = z.object({
  sessionId: z.string().uuid().optional(),
  tableId: z.string().uuid().optional(),
  items: z.array(
    z.object({
      menuItemId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
  specialInstructions: z.string().trim().max(500).optional(),
}).refine((data) => data.sessionId || data.tableId, {
  message: "Either sessionId or tableId is required",
  path: ["sessionId"],
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED']),
});