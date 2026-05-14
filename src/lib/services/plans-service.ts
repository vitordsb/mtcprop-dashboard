import { getCompanySnapshot } from "@/lib/company-snapshot";
import {
  CACHE_TAGS,
  DEFAULT_PAGINATION_LIMIT,
  MAX_PAGINATION_LIMIT,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { nelogicaService } from "@/lib/services/nelogica-service";
import type { PropTradingSubscription } from "@/lib/services/nelogica-types";
import { unstable_cache } from "next/cache";

export type ActivePlanListItem = {
  id: string;
  enrollmentId: string;
  /** CPF/CNPJ do trader (vindo da Nelogica) */
  document: string;
  /**
   * Subconta do trader na mesa Nelogica (campo `subAccount` da API).
   * Salvo como `nelogicaContaID` no Student.
   */
  conta: string;
  /** Conta master da mesa (campo `account` da API) */
  masterAccount: string | null;
  /** Nome da conta master (campo `accountHolder` da API) — ex: "MTC Prop Remunerado" */
  masterAccountHolder: string | null;
  studentName: string;
  planName: string;
  /**
   * Nome do plano contratado na Nelogica (campo `subscriptionPlanName`).
   * Complementa o nome do plano interno.
   */
  nelogicaSubscriptionPlanName: string | null;
  /** Nome do plano comprado na Guru (vindo do Enrollment.guruProductName) — match por CPF. */
  guruPlanName: string | null;
  /** Status atual da assinatura Guru — usado pra status de mensalidade etc. */
  guruStatus: string | null;
  /** Aprovação interna (APROVADO / REPROVADO / PENDENTE). */
  approvalStatus: "APROVADO" | "REPROVADO" | "PENDENTE";
  /** Data em que o admin decidiu (aprovou ou reprovou). */
  approvalDecidedAt: string | null;
  riskProfile: string;
  profitPlatform: string;
  startedAt: string;
  limitLoss: string;
  nelogicaStatus: string | null;
  nelogicaActivationCode: string | null;
  /** Indica se o trader está ativo na Nelogica (subconta encontrada no batch) */
  isNelogicaActive: boolean;
  /** Data de criação da subconta na Nelogica */
  nelogicaPointCreatedAt: string | null;
};

export type PlansPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  q?: string;
};

export type ActivePlansOverview = {
  company: ReturnType<typeof getCompanySnapshot>;
  plans: ActivePlanListItem[];
  pagination: PlansPagination;
  /** Mensagem de erro da API Nelogica, se inacessível */
  nelogicaError?: string;
};

const PLAN_RISK_PROFILE_MAP: Array<{ match: string; label: string; limitLoss: number }> = [
  // Planos originais (legado)
  { match: "expert", label: "EXPERT", limitLoss: 1500 },
  { match: "avançado", label: "AVANÇADO", limitLoss: 1000 },
  { match: "avancado", label: "AVANÇADO", limitLoss: 1000 },
  { match: "intermediário", label: "INTERMEDIÁRIO", limitLoss: 600 },
  { match: "intermediario", label: "INTERMEDIÁRIO", limitLoss: 600 },
  { match: "start", label: "START", limitLoss: 300 },
  // Planos da Nelogica via prop_trading
  { match: "profit pro", label: "PROFIT PRO", limitLoss: 1500 },
  { match: "profit one", label: "PROFIT ONE", limitLoss: 500 },
  { match: "profit plus", label: "PROFIT PLUS", limitLoss: 1000 },
];

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Sem data";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === "string" ? value : "Sem data";
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function toPositiveInteger(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function resolveRiskProfile(planName: string) {
  const normalized = normalizeText(planName);
  for (const rule of PLAN_RISK_PROFILE_MAP) {
    if (normalized.includes(normalizeText(rule.match))) {
      return { label: rule.label, limitLoss: formatCurrency(rule.limitLoss) };
    }
  }
  return { label: "PLANO", limitLoss: "N/D" };
}

// ─────────────────────────────────────────────────────────────
// Cache functions
// ─────────────────────────────────────────────────────────────

/**
 * Carrega TODOS os traders ativos da mesa proprietária de uma única vez.
 *
 * Usa `prop_trading_list_user_subscription` com `active: 1`.
 * Retorna mapa document (CPF normalizado) → PropTradingSubscription.
 *
 * Uma chamada por ciclo de 60s — elimina N+1 por trader na página.
 */
const getCachedPropTradersMap = unstable_cache(
  async (): Promise<Map<string, PropTradingSubscription>> => {
    try {
      const subscriptions = await nelogicaService.listPropTraders({ active: 1, perPage: 1000 });
      const map = new Map<string, PropTradingSubscription>();
      for (const sub of subscriptions) {
        // Indexa por CPF/CNPJ normalizado (somente dígitos)
        const normalizedDoc = sub.document.replace(/\D/g, "");
        map.set(normalizedDoc, sub);
      }
      return map;
    } catch {
      return new Map<string, PropTradingSubscription>();
    }
  },
  [CACHE_TAGS.ACTIVE_PLANS_OVERVIEW, "nelogica-prop-traders-map"],
  { revalidate: 60, tags: [CACHE_TAGS.ACTIVE_PLANS_OVERVIEW] },
);


// ─────────────────────────────────────────────────────────────
// Main cached query
// ─────────────────────────────────────────────────────────────

const getCachedActivePlans = unstable_cache(
  async (
    pageParam?: number | string | null,
    limitParam?: number | string | null,
    queryParam?: string | null,
  ): Promise<ActivePlansOverview> => {
    const params = { page: pageParam, limit: limitParam, q: queryParam };
    const requestedLimit = toPositiveInteger(params?.limit) ?? DEFAULT_PAGINATION_LIMIT;
    const limit = Math.min(requestedLimit, MAX_PAGINATION_LIMIT);
    const requestedPage = toPositiveInteger(params?.page) ?? 1;
    const searchQuery = params?.q?.trim().toLowerCase();

    // Fonte primária: Nelogica (TODOS os traders ativos na mesa proprietária).
    const propTradersMap = await getCachedPropTradersMap();
    const allTraders = Array.from(propTradersMap.values());

    // Filtro por busca (nome do trader, document, conta, plano)
    const filtered = searchQuery
      ? allTraders.filter((t) =>
          [t.subAccountHolder, t.document, t.subAccount, t.account, t.subscriptionPlanName, t.product]
            .some((field) => field?.toLowerCase().includes(searchQuery)),
        )
      : allTraders;

    // Ordena por createdAt desc (mais recentes primeiro)
    filtered.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(requestedPage, totalPages);
    const skip = (page - 1) * limit;
    const pageSlice = filtered.slice(skip, skip + limit);

    // Enriquece com dados do banco (Student/Enrollment) se existir match por documento
    const docs = pageSlice.map((t) => t.document.replace(/\D/g, "")).filter(Boolean);
    const studentsArray = docs.length > 0
      ? await prisma.student.findMany({
          where: { nelogicaDocument: { in: docs } },
          include: { enrollments: { where: { status: "ACTIVE" }, include: { product: true }, take: 1 } },
        })
      : [];
    type StudentWithEnrollments = (typeof studentsArray)[number];
    const studentsByDoc = new Map<string, StudentWithEnrollments>();
    for (const s of studentsArray) {
      if (s.nelogicaDocument) studentsByDoc.set(s.nelogicaDocument.replace(/\D/g, ""), s);
    }

    const plans: ActivePlanListItem[] = pageSlice.map((propSub) => {
      const normalizedDoc = propSub.document.replace(/\D/g, "");
      const student = studentsByDoc.get(normalizedDoc) ?? null;
      const enrollment = student?.enrollments?.[0] ?? null;
      const product = enrollment?.product ?? null;
      const subAccount = propSub.subAccount;

      const planNameRef = product?.name ?? propSub.subscriptionPlanName;
      const resolvedRiskProfile = resolveRiskProfile(planNameRef);

      return {
        id: student?.id ?? `nelogica-${propSub.subAccount}`,
        enrollmentId: enrollment?.id ?? "",
        document: propSub.document,
        conta: subAccount,
        masterAccount: propSub.account,
        masterAccountHolder: propSub.accountHolder,
        studentName: propSub.subAccountHolder || student?.name || "—",
        planName: planNameRef,
        nelogicaSubscriptionPlanName: propSub.subscriptionPlanName,
        guruPlanName: enrollment?.guruProductName ?? null,
        guruStatus: enrollment?.guruStatus ?? null,
        approvalStatus: (enrollment?.approvalStatus as "APROVADO" | "REPROVADO" | "PENDENTE" | undefined) ?? "PENDENTE",
        approvalDecidedAt: enrollment?.approvalDecidedAt ? enrollment.approvalDecidedAt.toISOString() : null,
        riskProfile: resolvedRiskProfile.label,
        profitPlatform: propSub.product,
        startedAt: formatDate(propSub.createdAt),
        limitLoss: resolvedRiskProfile.limitLoss,
        nelogicaStatus: student?.nelogicaStatus ?? "ATIVO",
        nelogicaActivationCode: propSub.activationCode,
        isNelogicaActive: true,
        nelogicaPointCreatedAt: propSub.createdAt,
      } satisfies ActivePlanListItem;
    });

    return {
      company: getCompanySnapshot(),
      plans,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
        q: params?.q ?? undefined,
      },
    };
  },
  [CACHE_TAGS.ACTIVE_PLANS_OVERVIEW],
  { revalidate: 60, tags: [CACHE_TAGS.ACTIVE_PLANS_OVERVIEW] },
);

export const plansService = {
  async getActivePlans(params?: {
    page?: number | string | null;
    limit?: number | string | null;
    q?: string | null;
  }): Promise<ActivePlansOverview> {
    return getCachedActivePlans(params?.page, params?.limit, params?.q);
  },
};
