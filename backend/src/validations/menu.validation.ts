// src/schemas/menu.schema.ts
import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(50),
});

export const createMenuItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().url().optional(),
  price: z.number().positive(),
  costPrice: z.number().positive(),
  categoryId: z.string().uuid(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial().extend({
  isAvailable: z.boolean().optional(),
});