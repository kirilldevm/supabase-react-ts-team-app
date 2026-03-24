import { z } from 'zod';

export const productFormSchema = z.object({
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
});

export type ProductFormFields = z.infer<typeof productFormSchema>;

// Kept for backward compatibility with any existing imports.
export const createProductSchema = productFormSchema;
export type CreateProductFormValues = ProductFormFields;
