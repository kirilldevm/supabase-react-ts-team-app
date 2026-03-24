import { z } from 'zod';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const createProductSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must be at most 2 000 characters')
    .optional(),
  image: z
    .instanceof(File)
    .refine((f) => f.size <= MAX_IMAGE_BYTES, 'Image must be smaller than 5 MB')
    .refine(
      (f) => ACCEPTED_IMAGE_TYPES.includes(f.type),
      'Only JPEG, PNG, WebP and GIF are supported',
    )
    .nullable()
    .optional(),
});

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
