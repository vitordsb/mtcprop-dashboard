import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import type { LoginInput } from "@/validators/auth";

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
} as const;

export const authService = {
  async login(input: LoginInput) {
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: input.email },
      select: {
        ...adminUserSelect,
        passwordHash: true,
      },
    });

    if (!adminUser?.isActive) {
      return null;
    }

    const passwordMatches = await verifyPassword(
      input.password,
      adminUser.passwordHash,
    );

    if (!passwordMatches) {
      return null;
    }

    const loginAt = new Date();
    const [updatedAdminUser] = await prisma.$transaction([
      prisma.adminUser.update({
        where: { id: adminUser.id },
        data: { lastLoginAt: loginAt },
        select: adminUserSelect,
      }),
      prisma.auditEvent.create({
        data: {
          adminUserId: adminUser.id,
          action: "auth.login.succeeded",
          entityType: "adminUser",
          entityId: adminUser.id,
          payload: {
            email: adminUser.email,
            loggedAt: loginAt.toISOString(),
          },
        },
      }),
    ]);

    return updatedAdminUser;
  },

  async recordLogout(adminUserId: string) {
    await prisma.auditEvent.create({
      data: {
        adminUserId,
        action: "auth.logout.succeeded",
        entityType: "adminUser",
        entityId: adminUserId,
        payload: {
          loggedOutAt: new Date().toISOString(),
        },
      },
    });
  },
};
