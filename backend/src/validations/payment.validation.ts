import { z } from 'zod';

export const createPaymentSchema = z.object({
  sessionId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['CASH', 'CARD', 'ONLINE']),
  gatewayReferenceId: z.string().optional(),
});

export const createOnlinePaymentSchema = z.object({
  method: z.enum(['ONLINE']),
});