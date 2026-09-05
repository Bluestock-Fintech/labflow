import { z } from 'zod';

const facilityItem = z.object({
  facility_id: z.string().uuid().optional(),
  custom_name: z.string().min(1).max(100).optional(),
  price: z.number().min(0),
}).refine((v) => v.facility_id || v.custom_name, {
  message: 'Each facility needs either facility_id or custom_name',
});

const layoutConfigSchema = z.object({
  type: z.enum(['VERTICAL', 'HORIZONTAL', 'SPLIT']),
  rows: z.number().int().min(1).max(50),
  columns: z.number().int().min(1).max(50),
  blocked: z.array(z.number().int().min(0)).default([]),
}).optional();

export const createFloorSchema = z.object({
  floor_name: z.string().min(1).max(100),
  total_seats: z.number().int().min(1).max(1000),
  full_time_price: z.number().min(0),
  half_time_price: z.number().min(0).optional(),
  per_day_price: z.number().min(0).optional(),
  facilities: z.array(facilityItem).default([]),
  layout_config: layoutConfigSchema,
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

export const updateFloorSchema = z.object({
  floor_name: z.string().min(1).max(100).optional(),
  total_seats: z.number().int().min(1).max(1000).optional(),
  full_time_price: z.number().min(0).optional(),
  half_time_price: z.number().min(0).optional(),
  per_day_price: z.number().min(0).optional(),
  facilities: z.array(facilityItem).optional(),
  layout_config: layoutConfigSchema,
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});
