import { getCompanySnapshot } from "@/lib/company-snapshot";
import {
  CACHE_TAGS,
  DEFAULT_PAGINATION_LIMIT,
  MAX_PAGINATION_LIMIT,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { nelogicaService } from "@/lib/services/nelogica-service";
import { unstable_cache } from "next/cache";

export type ActivePlanListItem = {
  id: string;
  enrollmentId: string;
  conta: string;
  studentName: string;
  planName: string;
  riskProfile: string;
  profitPlatform: string;
  startedAt: string;
  limitLoss: string;
  monthlyBalance: string;
  totalBalance: string;
  monthlyBalanceValue: number;
  totalBalanceValue: number;
  nelogicaStatus: string | null;
  nelogicaActivationCode: string | null;
  nelogicaLiveStatusCode: string | null;
  nelogicaLiveStatusLabel: string | null;
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
};

const NELOGICA_STATUS_LABEL: Record<string, string> = {
  "0": "Bloqueado (Inadimplente)",
  "1": "Sem licença",
  "2": "Ativo (outra corretora)",
  "3": "Ativo MTCprop",
  "4": "Inativo",
};

const PLAN_RISK_PROFILE_MAP: Array<{ match: string; label: string; limitLoss: number }> = [
  { match: "expert", label: "EXPERT", limitLoss: 1500 },
  { match: "avançado", label: "AVANÇADO", limitLoss: 1000 },
  { match: "avancado", label: "AVANÇADO", limitLoss: 1000 },
  { match: "intermediário", label: "INTERMEDIÁRIO", limitLoss: 600 },
  { match: "intermediario", label: "INTERMEDIÁRIO", limitLoss: 600 },
  { match: "start", label: "START", limitLoss: 300 },
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
      return {
        label: rule.label,
        limitLoss: formatCurrency(rule.limitLoss),
      };
    }
  }

  return {
    label: "PLANO",
    limitLoss: "N/D",
  };
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const format = (date: Date) => date.toISOString().slice(0, 10);

  return {
    start: format(start),
    end: format(end),
  };
}

function sumFinancialResults(
  results: Array<{ fResultadoFinanceiro: string }>,
) {
  return results.reduce((total, item) => {
    const parsed = Number.parseFloat(item.fResultadoFinanceiro);
    return total + (Number.isFinite(parsed) ? parsed : 0);
  }, 0);
}

const getCachedNelogicaLiveStatus = unstable_cache(
  async (document: string | null | undefined) => {
    if (!document) return null;

    const result = await nelogicaService.checkClientStatus(document);
    return {
      code: result.status,
      label: NELOGICA_STATUS_LABEL[result.status] ?? `Status ${result.status}`,
    };
  },
  [CACHE_TAGS.ACTIVE_PLANS_OVERVIEW, "nelogica-live-status"],
  { revalidate: 120, tags: [CACHE_TAGS.ACTIVE_PLANS_OVERVIEW] },
);

const getCachedBrokerAccount = unstable_cache(
  async (contaID: string | null | undefined) => {
    if (!contaID) return null;

    const accounts = await nelogicaService.listBrokerAccounts({ contaID, nRows: 20 });
    return accounts.find((item) => item.contaID === contaID) ?? null;
  },
  [CACHE_TAGS.ACTIVE_PLANS_OVERVIEW, "nelogica-broker-account"],
  { revalidate: 300, tags: [CACHE_TAGS.ACTIVE_PLANS_OVERVIEW] },
);

const getCachedFinancialResultSummary = unstable_cache(
  async (
    contaID: string | null | undefined,
    dtInicio: string,
    dtFinal: string,
    nRows: number,
  ) => {
    if (!contaID) return 0;

    const results = await nelogicaService.listFinancialResults({
      contaID,
      dtInicio,
      dtFinal,
      nRows,
    });

    return sumFinancialResults(results);
  },
  [CACHE_TAGS.ACTIVE_PLANS_OVERVIEW, "nelogica-financial-summary"],
  { revalidate: 120, tags: [CACHE_TAGS.ACTIVE_PLANS_OVERVIEW] },
);

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
    const searchQuery = params?.q?.trim();

    const baseWhere: Record<string, unknown> = { status: "ACTIVE" };

    if (searchQuery) {
      baseWhere.OR = [
        { student: { name: { contains: searchQuery, mode: "insensitive" } } },
        { student: { email: { contains: searchQuery, mode: "insensitive" } } },
        { student: { nelogicaContaID: { contains: searchQuery, mode: "insensitive" } } },
        { student: { nelogicaStatus: { contains: searchQuery, mode: "insensitive" } } },
        { student: { nelogicaActivationCode: { contains: searchQuery, mode: "insensitive" } } },
        { product: { name: { contains: searchQuery, mode: "insensitive" } } },
      ];
    }

    const total = await prisma.enrollment.count({ where: baseWhere });
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(requestedPage, totalPages);
    const skip = (page - 1) * limit;

    const enrollments = await prisma.enrollment.findMany({
      where: baseWhere,
      include: { student: true, product: true },
      orderBy: [{ startedAt: "desc" }],
      skip,
      take: limit,
    });

    const monthRange = getMonthRange();

    const plans = await Promise.all(
      enrollments.map(async (enrollment) => {
        const { student, product } = enrollment;
        const contaID = student.nelogicaContaID ?? "";

        const [liveStatus, brokerAccount, monthlyBalanceValue, totalBalanceValue] =
          await Promise.allSettled([
            getCachedNelogicaLiveStatus(student.nelogicaDocument),
            getCachedBrokerAccount(contaID),
            getCachedFinancialResultSummary(contaID, monthRange.start, monthRange.end, 200),
            getCachedFinancialResultSummary(contaID, "2020-01-01", monthRange.end, 2000),
          ]);

        const resolvedRiskProfile = resolveRiskProfile(product.name);
        const resolvedLiveStatus = liveStatus.status === "fulfilled" ? liveStatus.value : null;

        const resolvedBrokerAccount =
          brokerAccount.status === "fulfilled"
            ? brokerAccount.value
            : null;

        const resolvedMonthlyBalance =
          monthlyBalanceValue.status === "fulfilled" ? monthlyBalanceValue.value : 0;
        const resolvedTotalBalance =
          totalBalanceValue.status === "fulfilled" ? totalBalanceValue.value : 0;

        return {
          id: student.id,
          enrollmentId: enrollment.id,
          conta: contaID || "Sem conta",
          studentName: student.name,
          planName: product.name,
          riskProfile: resolvedRiskProfile.label,
          profitPlatform: resolvedBrokerAccount?.plataforma || student.nelogicaProduct || "Profit Pro",
          startedAt: formatDate(resolvedBrokerAccount?.dtInicioPlataforma ?? enrollment.startedAt),
          limitLoss: resolvedRiskProfile.limitLoss,
          monthlyBalance: formatCurrency(resolvedMonthlyBalance),
          totalBalance: formatCurrency(resolvedTotalBalance),
          monthlyBalanceValue: resolvedMonthlyBalance,
          totalBalanceValue: resolvedTotalBalance,
          nelogicaStatus: student.nelogicaStatus,
          nelogicaActivationCode: student.nelogicaActivationCode,
          nelogicaLiveStatusCode: resolvedLiveStatus?.code ?? null,
          nelogicaLiveStatusLabel: resolvedLiveStatus?.label ?? null,
        } satisfies ActivePlanListItem;
      }),
    );

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
  { revalidate: 30, tags: [CACHE_TAGS.ACTIVE_PLANS_OVERVIEW] },
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
