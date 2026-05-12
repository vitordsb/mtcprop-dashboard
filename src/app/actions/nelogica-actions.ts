"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireCurrentAdminUser } from "@/lib/auth/server";
import { CACHE_TAGS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { nelogicaService } from "@/lib/services/nelogica-service";

/**
 * Variáveis de ambiente necessárias para a API Mesa Proprietária:
 *
 * NELOGICA_PROP_MASTER_ACCOUNT     → número da conta master da mesa na Nelogica
 * NELOGICA_PROP_SUBSCRIPTION_PLAN_ID → ID do plano contratado pela MTCprop
 */
function getPropTradingConfig() {
  const masterAccount = process.env.NELOGICA_PROP_MASTER_ACCOUNT;
  const planIdStr = process.env.NELOGICA_PROP_SUBSCRIPTION_PLAN_ID;

  if (!masterAccount) {
    throw new Error(
      "Variável NELOGICA_PROP_MASTER_ACCOUNT não configurada no .env.local.\n" +
      "Informe o número da conta master da mesa proprietária na Nelogica.",
    );
  }

  if (!planIdStr) {
    throw new Error(
      "Variável NELOGICA_PROP_SUBSCRIPTION_PLAN_ID não configurada no .env.local.\n" +
      "Informe o ID do plano contratado pela MTCprop na Nelogica (ex: 5251).",
    );
  }

  const subscriptionPlanId = Number.parseInt(planIdStr, 10);
  if (!Number.isFinite(subscriptionPlanId)) {
    throw new Error(
      `NELOGICA_PROP_SUBSCRIPTION_PLAN_ID inválido: "${planIdStr}". Deve ser um número inteiro.`,
    );
  }

  return { masterAccount, subscriptionPlanId };
}

function invalidatePlanosAtivos() {
  revalidatePath("/dashboard/traders");
  revalidatePath("/dashboard/planos-ativos");
  revalidateTag(CACHE_TAGS.DASHBOARD_OVERVIEW, {});
  revalidateTag(CACHE_TAGS.ACTIVE_PLANS_OVERVIEW, {});
}

// ─────────────────────────────────────────────────────────────
// Provisionar — cria subconta na mesa proprietária
// ─────────────────────────────────────────────────────────────

export async function actionProvisionarLicenca(studentId: string) {
  await requireCurrentAdminUser();
  const { masterAccount, subscriptionPlanId } = getPropTradingConfig();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: { product: true },
        take: 1,
      },
    },
  });

  if (!student) throw new Error("Aluno não encontrado.");
  if (!student.email) throw new Error("Aluno não tem e-mail cadastrado.");

  const cpf = student.nelogicaDocument;
  if (!cpf) {
    throw new Error("O aluno precisa ter o CPF preenchido para prosseguir com a licença.");
  }

  const productInfo = student.enrollments[0]?.product;
  if (!productInfo) {
    throw new Error("O aluno precisa ter um plano ativo para emitir licença do Profit.");
  }

  const [firstName, ...lastNames] = student.name.split(" ");

  /**
   * O `testAccount` é o número da subconta a ser criada para este trader.
   * Usamos os primeiros 8 caracteres do ID do student como identificador único.
   * Salvo posteriormente em `nelogicaContaID`.
   */
  const subAccountId = student.id.substring(0, 8);

  const resposta = await nelogicaService.cadastrarSubContaProp({
    document: cpf,
    naturalPerson: 1,
    documentType: 1, // CPF
    firstName,
    lastName: lastNames.join(" ") || "Trader",
    email: student.email,
    subscriptionPlanId,
    testAccount: subAccountId,
  });

  if (!resposta.success) {
    throw new Error("Falha na Nelogica ao provisionar subconta: " + resposta.message);
  }

  // Configura risco base se o produto tiver maxContracts definido
  if (productInfo.maxContracts) {
    try {
      await nelogicaService.configurarRiscoConta({
        contaID: subAccountId,
        grupo: "PADRAO",
        dailyLoss: productInfo.price ? Number(productInfo.price) * -1 : -500,
        maxContratosTotais: productInfo.maxContracts,
      });
    } catch {
      // Risco não é bloqueante — subconta foi criada, apenas log
      console.warn("[Nelogica] Aviso: falha ao configurar risco para subconta", subAccountId);
    }
  }

  // Salva a subconta no Student
  await prisma.student.update({
    where: { id: studentId },
    data: {
      nelogicaContaID: subAccountId,
      nelogicaStatus: "ACTIVE",
    },
  });

  invalidatePlanosAtivos();
  return { success: true, subAccount: subAccountId, masterAccount };
}

// ─────────────────────────────────────────────────────────────
// Cancelar — cancela subconta na mesa proprietária
// ─────────────────────────────────────────────────────────────

export async function actionCancelarLicenca(studentId: string, _unused?: string) {
  await requireCurrentAdminUser();
  const { masterAccount, subscriptionPlanId } = getPropTradingConfig();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) throw new Error("Aluno não encontrado.");

  const cpf = student.nelogicaDocument;
  if (!cpf) throw new Error("CPF ausente no cadastro do aluno.");

  const subAccount = student.nelogicaContaID ?? undefined;

  const resposta = await nelogicaService.cancelarSubContaProp({
    document: cpf,
    subscriptionPlanId,
    account: masterAccount,
    testAccount: subAccount,
  });

  if (!resposta.success) {
    throw new Error("Erro da Nelogica ao tentar cancelar: " + resposta.message);
  }

  await prisma.student.update({
    where: { id: studentId },
    data: {
      nelogicaStatus: "CANCELLED",
      nelogicaActivationCode: null,
    },
  });

  invalidatePlanosAtivos();
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Reenviar Acesso
// ─────────────────────────────────────────────────────────────

/**
 * Consulta status realtime do trader na Nelogica (API genérica de status_client).
 * Mantido para compatibilidade — pode ser usado na página de Traders.
 */
export async function actionConsultarStatusRealtime(studentId: string) {
  await requireCurrentAdminUser();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student || !student.nelogicaDocument) {
    throw new Error("CPF/Documento interno faltando para buscar status externo.");
  }

  // Na nova API Mesa Prop, a verificação de atividade é feita via
  // prop_trading_list_user_subscription. Este endpoint legado ainda pode
  // ser usado como verificação complementar.
  const subAccount = student.nelogicaContaID;
  const isActive = subAccount
    ? (await nelogicaService.listPropTraders({ document: student.nelogicaDocument, active: 1 })).length > 0
    : false;

  const statusLiteral = isActive ? "Ativo MTCprop" : "Inativo / Não encontrado";

  await prisma.student.update({
    where: { id: studentId },
    data: { nelogicaStatus: statusLiteral },
  });

  invalidatePlanosAtivos();
  return { isActive, statusLiteral };
}
