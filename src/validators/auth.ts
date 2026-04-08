import { z } from "zod";

export const strongPasswordSchema = z
  .string()
  .min(14, "A senha precisa ter pelo menos 14 caracteres.")
  .regex(/[a-z]/, "A senha precisa ter ao menos uma letra minuscula.")
  .regex(/[A-Z]/, "A senha precisa ter ao menos uma letra maiuscula.")
  .regex(/\d/, "A senha precisa ter ao menos um numero.")
  .regex(/[^A-Za-z0-9]/, "A senha precisa ter ao menos um caractere especial.");

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um e-mail valido."),
  password: z.string().min(1, "Informe sua senha."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um e-mail valido."),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(20, "Link de recuperacao invalido."),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Confirme sua nova senha."),
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "As senhas nao coincidem.",
    path: ["confirmPassword"],
  });

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
