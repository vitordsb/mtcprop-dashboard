"use server";

import { revalidateTag } from "next/cache";
import { requireCurrentAdminUser } from "@/lib/auth/server";
import { CACHE_TAGS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function actionAprovarSolicitacao(id: string, adminNotes?: string) {
  const admin = await requireCurrentAdminUser();
  if (!id) throw new Error("id é obrigatório.");

  await prisma.solicitacao.update({
    where: { id },
    data: {
      status: "APROVADA",
      decidedAt: new Date(),
      decidedById: admin.id,
      adminNotes: adminNotes?.trim() || null,
    },
  });

  revalidateTag(CACHE_TAGS.SOLICITACOES_OVERVIEW, {});
}

export async function actionRejeitarSolicitacao(id: string, adminNotes?: string) {
  const admin = await requireCurrentAdminUser();
  if (!id) throw new Error("id é obrigatório.");

  await prisma.solicitacao.update({
    where: { id },
    data: {
      status: "REJEITADA",
      decidedAt: new Date(),
      decidedById: admin.id,
      adminNotes: adminNotes?.trim() || null,
    },
  });

  revalidateTag(CACHE_TAGS.SOLICITACOES_OVERVIEW, {});
}

/**
 * Marca a solicitação como concluída.
 * Executa side-effects específicos por tipo:
 * - MIGRACAO_MESA_REAL → TODO: provisionar nova subconta na master "Mesa Real" + cancelar atual.
 *   Por enquanto só marca como concluída (a execução fica manual).
 * - Demais tipos: apenas muda status.
 */
export async function actionConcluirSolicitacao(id: string) {
  const admin = await requireCurrentAdminUser();
  if (!id) throw new Error("id é obrigatório.");

  const solicitacao = await prisma.solicitacao.findUnique({ where: { id } });
  if (!solicitacao) throw new Error("Solicitação não encontrada.");
  if (solicitacao.status !== "APROVADA") {
    throw new Error("Solicitação precisa estar APROVADA antes de ser concluída.");
  }

  // TODO: implementar execução automática por tipo (provisionar Mesa Real etc).
  // Por enquanto só registra a conclusão — o admin executa a ação fora do dashboard.

  await prisma.solicitacao.update({
    where: { id },
    data: {
      status: "CONCLUIDA",
      decidedAt: new Date(),
      decidedById: admin.id,
    },
  });

  revalidateTag(CACHE_TAGS.SOLICITACOES_OVERVIEW, {});
  revalidateTag(CACHE_TAGS.ACTIVE_PLANS_OVERVIEW, {});
}

export async function actionResetSolicitacao(id: string) {
  const admin = await requireCurrentAdminUser();
  if (!id) throw new Error("id é obrigatório.");

  await prisma.solicitacao.update({
    where: { id },
    data: {
      status: "PENDENTE",
      decidedAt: null,
      decidedById: admin.id,
      adminNotes: null,
    },
  });

  revalidateTag(CACHE_TAGS.SOLICITACOES_OVERVIEW, {});
}
