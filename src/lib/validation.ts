import { z } from 'zod';
import { copy } from '@/lib/copy';

export const userIdSchema = z.string().uuid();

export const usernameSchema = z
  .string()
  .trim()
  .min(2)
  .max(30)
  .regex(/^[a-z0-9._-]+$/, copy.validation.usernamePattern)
  .transform((value) => value.toLowerCase());

export const displayNameSchema = z.string().trim().min(2).max(80);

export const passwordSchema = z
  .string()
  .min(8, copy.validation.passwordTooShort)
  .max(128);
