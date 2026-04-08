"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireCurrentAdminUser } from "@/lib/auth/server";
import { CACHE_TAGS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { nelogicaService } from "@/lib/services/nelogica-service";

export async function actionProvisionarLicenca(studentId: string) {
  await requireCurrentAdminUser();

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

  if (!student) throw new Error("Aluno não encontrado");
  if (!student.email) throw new Error("Aluno não tem e-mail cadastrado");

  const cpf = student.nelogicaDocument || "00000000000"; // Requerer CPF real da base
  if (cpf === "00000000000") {
    throw new Error("O Aluno precisa ter o CPF preenchido para prosseguir com a licença.");
  }

  // 1. Validar se a pessoa não está devendo pra Nelogica ou usando outro Profit em outra mesa
  const statusNelogica = await nelogicaService.checkClientStatus(cpf);

  if (statusNelogica.status === "0") {
    throw new Error("CPF Bloqueado por Inadimplência na Nelogica.");
  }

  // Se = 2, logou em outra corretora. É bom notificar, mas no caso vamos prosseguir se for plano start/simples?
  // O ideal aqui é definir como a mesa quer operar. Vamos permitir gerar para quem for = "1" (livre) ou dar overlay.
  // Vamos considerar livre e provisionar.

  // 2. Extrair dados de endereço de preenchimento obrigatório (aqui mocks provisórios de mesa operando simplificado)
  const [firstName, ...lastNames] = student.name.split(" ");
  const productInfo = student.enrollments[0]?.product;

  if (!productInfo) {
    throw new Error("O Aluno precisa ter um plano ativo para emitir licença do Profit.");
  }

  // Cadastrando
  const point = await nelogicaService.cadastrarPonto({
    cpf_cnpj: cpf,
    nome: firstName,
    sobrenome: lastNames.join(" ") || "Trader",
    cep: "00000000",
    estado: "SP",
    cidade: "São Paulo",
    bairro: "Centro",
    logradouro: "Rua Principal",
    numero: "100",
    email: student.email,
    dataNascimento: "01/01/1990", // Placeholder (precisa vir do DB no futuro)
    sexo: 1,
    titularConta: student.name,
    contaID: student.id.substring(0, 8), // Mapeamento da conta para um slug curto do banco
    planoAssinaturaID: 1, // ID Base gerado na Nelogica para a MTCprop
    produto: "pro", 
  });

  if (point.status !== "1" || !point.codigoAtivacao) {
    throw new Error("Falha na Nelogica ao habilitar: " + JSON.stringify(point));
  }

  // 3. Configuração de Risco com base no 'maxContracts' do produto
  if (productInfo.maxContracts) {
    await nelogicaService.configurarRiscoConta({
      contaID: student.id.substring(0, 8),
      grupo: "PADRAO",
      dailyLoss: productInfo.price ? Number(productInfo.price) * -1 : -500, // Simulando loss limit basado no preço
      maxContratosTotais: productInfo.maxContracts,
    });
  }

  // 4. Salvar tudo no nosso Prisma
  await prisma.student.update({
    where: { id: studentId },
    data: {
      nelogicaContaID: student.id.substring(0, 8),
      nelogicaActivationCode: point.codigoAtivacao,
      nelogicaStatus: "ACTIVE",
    },
  });

  revalidatePath("/dashboard/traders");
  revalidatePath("/dashboard/planos-ativos");
  revalidateTag(CACHE_TAGS.DASHBOARD_OVERVIEW, {});
  revalidateTag(CACHE_TAGS.ACTIVE_PLANS_OVERVIEW, {});
  return { success: true, activationCode: point.codigoAtivacao };
}

export async function actionCancelarLicenca(studentId: string, customCpf?: string) {
  await requireCurrentAdminUser();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) throw new Error("Aluno não encontrado");

  const cpf = customCpf || student.nelogicaDocument;
  if (!cpf) throw new Error("CPF ausente.");

  const resposta = await nelogicaService.cancelarPonto(cpf, "pro");

  if (resposta.status === "1") {
    await prisma.student.update({
      where: { id: studentId },
      data: {
        nelogicaStatus: "CANCELLED",
        nelogicaActivationCode: null,
      },
    });

    revalidatePath("/dashboard/traders");
    revalidatePath("/dashboard/planos-ativos");
    revalidateTag(CACHE_TAGS.DASHBOARD_OVERVIEW, {});
    revalidateTag(CACHE_TAGS.ACTIVE_PLANS_OVERVIEW, {});
    return { success: true };
  }

  throw new Error("Erro da Nelogica ao tentar cancelar: " + JSON.stringify(resposta));
}

export async function actionConsultarStatusRealtime(studentId: string) {
  await requireCurrentAdminUser();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student || !student.nelogicaDocument) {
    throw new Error("CPF/Documento interno faltando para buscar status externo.");
  }

  const result = await nelogicaService.checkClientStatus(student.nelogicaDocument);
  const descriptionMap: Record<string, string> = {
    "0": "Inadimplente (Bloqueado Nelogica)",
    "1": "Não possui Profit vinculado",
    "2": "Ponto ativo Nelogica (Outra Corretora)",
    "3": "Ponto ativo MTCprop",
    "4": "Já foi assinante/teste (Sem ponto ativo)",
  };

  const statusLiteral = descriptionMap[result.status] || "Status Desconhecido";

  await prisma.student.update({
    where: { id: studentId },
    data: {
      nelogicaStatus: statusLiteral,
    },
  });

  revalidatePath("/dashboard/traders");
  revalidatePath("/dashboard/planos-ativos");
  revalidateTag(CACHE_TAGS.DASHBOARD_OVERVIEW, {});
  revalidateTag(CACHE_TAGS.ACTIVE_PLANS_OVERVIEW, {});
  return { status: result.status, statusLiteral };
}
