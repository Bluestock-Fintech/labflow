import { z } from 'zod';

export const createOwnerOrderSchema = z.object({
  floor_id: z.string().uuid(),
  seat_id: z.string().uuid(),
  customer_name: z.string().min(1).max(150),
  customer_email: z.string().email(),
  customer_mobile: z.string().regex(/^[0-9]{10}$/, 'Mobile must be a 10-digit number'),
  start_date: z.string().min(1),
  duration_label: z.string().min(1).max(50),
  duration_days: z.number().int().min(1).max(3650),
  payment_method: z.enum(['CASH', 'ONLINE']),
  seat_type: z.enum(['FULL_TIME', 'HALF_TIME']).optional(),
});

export const createPublicOrderSchema = createOwnerOrderSchema;

export const renewOrderSchema = z.object({
  start_date: z.string().min(1),
  duration_label: z.string().min(1).max(50),
  duration_days: z.number().int().min(1).max(3650),
  payment_method: z.enum(['CASH', 'ONLINE']),
  seat_type: z.enum(['FULL_TIME', 'HALF_TIME']).optional(),
});
