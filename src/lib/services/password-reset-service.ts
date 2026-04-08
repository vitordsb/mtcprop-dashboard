import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { sendPasswordResetEmail } from "@/lib/services/mail-service";
import type {
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@/validators/auth";

const PASSWORD_RESET_TTL_MINUTES = 120;

function createRawResetToken() {
  return randomBytes(32).toString("base64url");
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildResetUrl(origin: string, token: string) {
  const resetUrl = new URL("/nova-senha", origin);
  resetUrl.searchParams.set("token", token);
  return resetUrl.toString();
}

export const passwordResetService = {
  async request(input: ForgotPasswordInput, origin: string) {
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    if (!adminUser?.isActive) {
      return {
        created: false,
      };
    }

    const rawToken = createRawResetToken();
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000,
    );
    const resetUrl = buildResetUrl(origin, rawToken);

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: {
          adminUserId: adminUser.id,
        },
      }),
      prisma.passwordResetToken.create({
        data: {
          adminUserId: adminUser.id,
          tokenHash,
          expiresAt,
        },
      }),
      prisma.auditEvent.create({
        data: {
          adminUserId: adminUser.id,
          action: "auth.password-reset.requested",
          entityType: "adminUser",
          entityId: adminUser.id,
          payload: {
            email: adminUser.email,
            expiresAt: expiresAt.toISOString(),
          },
        },
      }),
    ]);

    const delivery = await sendPasswordResetEmail({
      to: adminUser.email,
      name: adminUser.name,
      resetUrl,
      expiresAt,
    });

    return {
      created: true,
      deliveryMode: delivery.mode,
    };
  },

  async reset(input: ResetPasswordInput) {
    const tokenHash = hashResetToken(input.token);
    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        adminUser: {
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        },
      },
    });

    const now = new Date();

    if (
      !passwordResetToken ||
      passwordResetToken.usedAt ||
      passwordResetToken.expiresAt <= now ||
      !passwordResetToken.adminUser.isActive
    ) {
      return {
        success: false as const,
      };
    }

    const passwordHash = await hashPassword(input.password);

    await prisma.$transaction([
      prisma.adminUser.update({
        where: { id: passwordResetToken.adminUser.id },
        data: {
          passwordHash,
        },
      }),
      prisma.passwordResetToken.updateMany({
        where: {
          adminUserId: passwordResetToken.adminUser.id,
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      }),
      prisma.auditEvent.create({
        data: {
          adminUserId: passwordResetToken.adminUser.id,
          action: "auth.password-reset.completed",
          entityType: "adminUser",
          entityId: passwordResetToken.adminUser.id,
          payload: {
            email: passwordResetToken.adminUser.email,
            completedAt: now.toISOString(),
          },
        },
      }),
    ]);

    return {
      success: true as const,
    };
  },
};
