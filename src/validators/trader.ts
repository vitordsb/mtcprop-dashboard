import { StudentStage } from "@prisma/client";
import { z } from "zod";

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const optionalDateString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

export const traderFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe um nome com pelo menos 3 caracteres."),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .transform((value) => value.toLowerCase()),
  phone: optionalTrimmedString,
  mentorName: optionalTrimmedString,
  nelogicaDocument: optionalTrimmedString,
  stage: z.nativeEnum(StudentStage, {
    errorMap: () => ({ message: "Selecione uma etapa válida." }),
  }),
  isActive: z.boolean(),
  productId: optionalTrimmedString,
  startedAt: optionalDateString,
});

export type TraderFormInput = z.infer<typeof traderFormSchema>;

export const createGuruContactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe o nome completo."),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .transform((value) => value.toLowerCase()),
  document: optionalTrimmedString,
  cellphone: z
    .string()
    .trim()
    .min(8, "Informe um celular válido."),
  country: z
    .string()
    .trim()
    .min(2, "Selecione o país.")
    .transform((value) => value.toUpperCase()),
  street: optionalTrimmedString,
  number: optionalTrimmedString,
  complement: optionalTrimmedString,
  district: optionalTrimmedString,
  city: optionalTrimmedString,
  state: z
    .string()
    .trim()
    .min(2, "Informe o estado."),
  zipcode: optionalTrimmedString,
});

export type CreateGuruContactInput = z.infer<typeof createGuruContactSchema>;
