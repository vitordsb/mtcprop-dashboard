import type { AuthenticatedAdminUser } from "@/lib/auth/server";
import { unstable_cache } from "next/cache";
import { UserRole } from "@prisma/client";

import { hashPassword } from "@/lib/auth/password";
import { getCompanySnapshot } from "@/lib/company-snapshot";
import { CACHE_TAGS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/services/audit-service";
import type { AdminUsersOverview } from "@/types/admin-users";
import type {
  CreateAdminUserInput,
  UpdateAdminUserInput,
} from "@/validators/admin-user";

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

function getCachedAdminUsersOverview() {
  return unstable_cache(
    async (): Promise<AdminUsersOverview> => {
      const admins = await prisma.adminUser.findMany({
        select: adminUserSelect,
        orderBy: [
          {
            role: "asc",
          },
          {
            name: "asc",
          },
        ],
      });

      return {
        company: getCompanySnapshot(),
        admins: admins.map((adminUser) => ({
          ...adminUser,
          lastLoginAt: adminUser.lastLoginAt?.toISOString() ?? null,
          createdAt: adminUser.createdAt.toISOString(),
          updatedAt: adminUser.updatedAt.toISOString(),
        })),
        summary: {
          total: admins.length,
          active: admins.filter((adminUser) => adminUser.isActive).length,
          inactive: admins.filter((adminUser) => !adminUser.isActive).length,
          owners: admins.filter((adminUser) => adminUser.role === "OWNER").length,
        },
      };
    },
    [CACHE_TAGS.ADMIN_USERS_OVERVIEW],
    {
      revalidate: 30,
      tags: [CACHE_TAGS.ADMIN_USERS_OVERVIEW],
    },
  )();
}

async function ensureTargetAdminExists(targetAdminUserId: string) {
  const targetAdminUser = await prisma.adminUser.findUnique({
    where: { id: targetAdminUserId },
    select: adminUserSelect,
  });

  if (!targetAdminUser) {
    throw new Error("Acesso administrativo nao encontrado.");
  }

  return targetAdminUser;
}

async function ensureOwnerSafety(params: {
  actor: AuthenticatedAdminUser;
  targetAdminUserId: string;
  nextIsActive?: boolean;
  operation: "update" | "delete";
}) {
  const targetAdminUser = await ensureTargetAdminExists(params.targetAdminUserId);

  if (targetAdminUser.id === params.actor.id) {
    if (params.operation === "delete") {
      throw new Error("Voce nao pode excluir o proprio acesso.");
    }

    if (params.nextIsActive === false) {
      throw new Error("Voce nao pode desativar o proprio acesso.");
    }
  }

  if (
    targetAdminUser.role === "OWNER" &&
    targetAdminUser.isActive &&
    (params.operation === "delete" || params.nextIsActive === false)
  ) {
    const activeOwners = await prisma.adminUser.count({
      where: {
        role: UserRole.OWNER,
        isActive: true,
      },
    });

    if (activeOwners <= 1) {
      throw new Error("Nao e possivel remover o ultimo owner ativo da plataforma.");
    }
  }

  return targetAdminUser;
}

function mapUniqueConstraintError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  ) {
    return new Error("Ja existe um acesso usando esse e-mail.");
  }

  return error;
}

export const adminUsersService = {
  async getOverview() {
    return getCachedAdminUsersOverview();
  },

  async create(
    actor: AuthenticatedAdminUser,
    input: CreateAdminUserInput,
  ) {
    try {
      const passwordHash = await hashPassword(input.password);

      const createdAdminUser = await prisma.adminUser.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: UserRole.ADMIN,
          isActive: true,
        },
        select: adminUserSelect,
      });

      await createAuditEvent({
        adminUserId: actor.id,
        action: "admin-user.created",
        entityType: "adminUser",
        entityId: createdAdminUser.id,
        payload: {
          email: createdAdminUser.email,
          role: createdAdminUser.role,
          createdBy: actor.email,
        },
      });

      return createdAdminUser;
    } catch (error) {
      throw mapUniqueConstraintError(error);
    }
  },

  async update(
    actor: AuthenticatedAdminUser,
    targetAdminUserId: string,
    input: UpdateAdminUserInput,
  ) {
    const targetAdminUser = await ensureOwnerSafety({
      actor,
      targetAdminUserId,
      nextIsActive: input.isActive,
      operation: "update",
    });

    if (targetAdminUser.id === actor.id && targetAdminUser.email !== input.email) {
      throw new Error(
        "Por seguranca, altere o proprio e-mail em uma etapa dedicada.",
      );
    }

    try {
      const updatedAdminUser = await prisma.adminUser.update({
        where: { id: targetAdminUserId },
        data: {
          name: input.name,
          email: input.email,
          isActive: input.isActive,
          ...(input.password
            ? {
                passwordHash: await hashPassword(input.password),
              }
            : {}),
        },
        select: adminUserSelect,
      });

      await createAuditEvent({
        adminUserId: actor.id,
        action: "admin-user.updated",
        entityType: "adminUser",
        entityId: updatedAdminUser.id,
        payload: {
          previousEmail: targetAdminUser.email,
          nextEmail: updatedAdminUser.email,
          previousIsActive: targetAdminUser.isActive,
          nextIsActive: updatedAdminUser.isActive,
          passwordRotated: Boolean(input.password),
          updatedBy: actor.email,
        },
      });

      return updatedAdminUser;
    } catch (error) {
      throw mapUniqueConstraintError(error);
    }
  },

  async revoke(
    actor: AuthenticatedAdminUser,
    targetAdminUserId: string,
  ) {
    const targetAdminUser = await ensureOwnerSafety({
      actor,
      targetAdminUserId,
      operation: "delete",
    });

    const revokedAdminUser = await prisma.adminUser.update({
      where: { id: targetAdminUserId },
      data: {
        isActive: false,
      },
      select: adminUserSelect,
    });

    await createAuditEvent({
      adminUserId: actor.id,
      action: "admin-user.revoked",
      entityType: "adminUser",
      entityId: revokedAdminUser.id,
      payload: {
        email: revokedAdminUser.email,
        previousIsActive: targetAdminUser.isActive,
        revokedBy: actor.email,
      },
    });

    return revokedAdminUser;
  },
};
