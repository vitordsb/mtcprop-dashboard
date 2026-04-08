import { z } from "zod";

import { strongPasswordSchema } from "@/validators/auth";

const normalizedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Informe um e-mail valido.");

const normalizedNameSchema = z
  .string()
  .trim()
  .min(3, "Informe o nome completo com pelo menos 3 caracteres.");

export const createAdminUserSchema = z.object({
  name: normalizedNameSchema,
  email: normalizedEmailSchema,
  password: strongPasswordSchema,
});

export const updateAdminUserSchema = z.object({
  name: normalizedNameSchema,
  email: normalizedEmailSchema,
  password: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine(
      (value) => (value ? strongPasswordSchema.safeParse(value).success : true),
      {
        message:
          "A nova senha precisa ter 14 caracteres, com maiuscula, minuscula, numero e caractere especial.",
      },
    ),
  isActive: z.boolean(),
});

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;
