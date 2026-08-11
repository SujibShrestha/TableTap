import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email().toLowerCase().trim(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});