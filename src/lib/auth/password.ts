import { compare, hash } from "bcryptjs";

import { strongPasswordSchema } from "@/validators/auth";

const PASSWORD_SALT_ROUNDS = 12;

export async function verifyPassword(
  password: string,
  passwordHash: string,
) {
  return compare(password, passwordHash);
}

export async function hashPassword(password: string) {
  strongPasswordSchema.parse(password);
  return hash(password, PASSWORD_SALT_ROUNDS);
}

export function isStrongPassword(password: string) {
  return strongPasswordSchema.safeParse(password).success;
}
