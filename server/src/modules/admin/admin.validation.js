import { z } from 'zod';

export const updateLibraryStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'SUSPENDED', 'CLOSED']),
});
