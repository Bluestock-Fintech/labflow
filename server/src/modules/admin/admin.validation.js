import { z } from 'zod';

export const updateLibraryStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'SUSPENDED', 'CLOSED']),
});

export const bulkImportLibrariesSchema = z.object({
  libraries: z.array(
    z.object({
      name: z.string().min(1),
      mobile: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')).transform((v) => v || undefined),
      address: z.string().optional(),
      city: z.string().optional(),
      area: z.string().optional(),
      pincode: z.string().optional(),
      map_link: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
  ).min(1),
});
