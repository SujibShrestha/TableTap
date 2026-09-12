import { z } from 'zod';

export const markCashPaymentSchema = z.object({
  method: z.enum(['CASH', 'CARD']),
});