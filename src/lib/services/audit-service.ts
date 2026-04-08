import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type CreateAuditEventParams = {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  payload?: Prisma.InputJsonValue;
};

export async function createAuditEvent(params: CreateAuditEventParams) {
  await prisma.auditEvent.create({
    data: {
      adminUserId: params.adminUserId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      payload: params.payload,
    },
  });
}
