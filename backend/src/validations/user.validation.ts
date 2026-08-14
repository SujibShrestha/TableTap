import { z } from 'zod';

export const createStaffSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email().max(255).toLowerCase().trim(),
  password: z.string().min(6).max(128),
  role: z.enum(['ADMIN', 'WAITER', 'KITCHEN', 'CASHIER']),
  phone: z.string().optional().nullable().transform((val) => val || null),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.email().max(255).toLowerCase().trim().optional(),
  phone: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (typeof val === 'string' && val.trim() === '' ? null : val)),
  role: z.enum(['ADMIN', 'WAITER', 'KITCHEN', 'CASHIER']).optional(),
  isActive: z.boolean().optional(),
});

export const updatePasswordSchema = z.object({
  newPassword: z.string().min(6).max(128),
});

export const changeOwnPasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6).max(128),
});