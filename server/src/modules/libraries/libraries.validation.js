import { z } from 'zod';

export const createLibrarySchema = z.object({
  name: z.string().min(2).max(150),
  email: z.string().email().optional(),
  mobile: z.string().regex(/^[0-9]{10}$/).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  area: z.string().max(100).optional(),
});

export const updateLibrarySchema = z.object({
  name: z.string().min(2).max(150).optional(),
  email: z.string().email().optional(),
  mobile: z.string().regex(/^[0-9]{10}$/).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  area: z.string().max(100).optional(),
  map_link: z.string().url().max(500).optional().or(z.literal('')),
});

export const commonFacilitiesSchema = z.object({
  facilities: z.array(
    z.object({
      facility_id: z.string().uuid(),
      price: z.number().min(0).default(0),
    })
  ),
});
