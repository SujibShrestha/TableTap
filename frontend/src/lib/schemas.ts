import { z } from "zod";

export const ROLES_SCHEMA = z.enum(["ADMIN", "WAITER", "KITCHEN", "CASHIER"]);

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.email("Enter a valid email").toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  phone: z.string().optional().nullable(),
  role: ROLES_SCHEMA,
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, "Name is required").optional(),
  email: z.email("Enter a valid email").toLowerCase().trim().optional(),
  phone: z.string().optional().nullable(),
  role: ROLES_SCHEMA.optional(),
  isActive: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters").max(128),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
