"use server";

import { revalidateTag } from "next/cache";
import { requireCurrentAdminUser } from "@/lib/auth/server";
import { CACHE_TAGS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

/**
 * Marca o Enrollment como APROVADO ou REPROVADO.
 * Registra quem decidiu e quando. Revalida o cache da página de planos ativos.
 */
export async function actionMarkApproval(
  enrollmentId: string,
  decision: "APROVADO" | "REPROVADO",
) {
  const admin = await requireCurrentAdminUser();

  if (!enrollmentId) {
    throw new Error("enrollmentId é obrigatório.");
  }

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      approvalStatus: decision,
      approvalDecidedAt: new Date(),
      approvalDecidedById: admin.id,
    },
  });

  revalidateTag(CACHE_TAGS.ACTIVE_PLANS_OVERVIEW, {});
}

/**
 * Reseta a decisão de aprovação (volta para PENDENTE).
 */
export async function actionResetApproval(enrollmentId: string) {
  const admin = await requireCurrentAdminUser();

  if (!enrollmentId) {
    throw new Error("enrollmentId é obrigatório.");
  }

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      approvalStatus: "PENDENTE",
      approvalDecidedAt: null,
      approvalDecidedById: admin.id,
    },
  });

  revalidateTag(CACHE_TAGS.ACTIVE_PLANS_OVERVIEW, {});
}
