import { z } from 'zod';

export const createStaffSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email().max(255).toLowerCase().trim(),
  password: z.string().min(6).max(128),
  role: z.enum(['ADMIN', 'WAITER', 'KITCHEN', 'CASHIER']),
  phone: z.string().optional().nullable().transform((val) => val || null),
});