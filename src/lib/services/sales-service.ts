import { unstable_cache } from "next/cache";

import { getCompanySnapshot } from "@/lib/company-snapshot";
import { CACHE_TAGS, DEFAULT_PAGINATION_LIMIT } from "@/lib/constants";
import { getGuruTransactionsByRange } from "@/lib/services/guru-transactions-client";
import type { SalesOverview, SalesPeriodPreset } from "@/types/sales";

type SalesOverviewParams = {
  period?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

function toInputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatPeriodLabel(period: SalesPeriodPreset, dateFrom: string, dateTo: string) {
  switch (period) {
    case "today":
      return "Hoje";
    case "month":
      return "Este mês";
    case "year":
      return "Este ano";
    case "custom":
      return `${new Intl.DateTimeFormat("pt-BR").format(new Date(`${dateFrom}T00:00:00`))} - ${new Intl.DateTimeFormat("pt-BR").format(new Date(`${dateTo}T00:00:00`))}`;
    case "week":
    default:
      return "Últimos 7 dias";
  }
}

function resolveSalesPeriod(params?: SalesOverviewParams) {
  const rawPeriod = params?.period?.trim().toLowerCase();
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const preset = (
    rawPeriod === "today" ||
    rawPeriod === "week" ||
    rawPeriod === "month" ||
    rawPeriod === "year" ||
    rawPeriod === "custom"
      ? rawPeriod
      : "week"
  ) as SalesPeriodPreset;

  if (preset === "custom") {
    const customStart = params?.dateFrom ? new Date(`${params.dateFrom}T00:00:00`) : null;
    const customEnd = params?.dateTo ? new Date(`${params.dateTo}T23:59:59`) : null;

    if (
      customStart &&
      customEnd &&
      !Number.isNaN(customStart.getTime()) &&
      !Number.isNaN(customEnd.getTime())
    ) {
      const start = customStart.getTime() <= customEnd.getTime() ? customStart : new Date(`${params?.dateTo}T00:00:00`);
      const safeEnd = customStart.getTime() <= customEnd.getTime() ? customEnd : new Date(`${params?.dateFrom}T23:59:59`);
      return {
        period: "custom" as const,
        dateFrom: toInputDate(start),
        dateTo: toInputDate(safeEnd),
        cacheKey: `custom:${toInputDate(start)}:${toInputDate(safeEnd)}`,
      };
    }
  }

  let start = new Date(end);

  switch (preset) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;
    case "week":
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
      break;
  }

  return {
    period: preset === "custom" ? "week" : preset,
    dateFrom: toInputDate(start),
    dateTo: toInputDate(end),
    cacheKey: `${preset}:${toInputDate(start)}:${toInputDate(end)}`,
  };
}

function getCachedSalesOverview(periodKey: string, dateFrom: string, dateTo: string) {
  return unstable_cache(
    async (): Promise<SalesOverview> => {
      const transactions = await getGuruTransactionsByRange({
        dateFrom,
        dateTo,
      }).catch((error) => {
        console.warn("[guru-transactions] falha ao consultar vendas gerais", error);
        return [];
      });

      const availableStatuses = Array.from(
        new Set(
          transactions
            .map((transaction) => transaction.statusLabel?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((left, right) => left.localeCompare(right, "pt-BR"));

      const period = periodKey.split(":")[0] as SalesPeriodPreset;

      return {
        company: getCompanySnapshot(),
        sales: transactions.map((transaction) => ({
          id: transaction.id,
          code: transaction.code,
          contactName: transaction.contactName,
          contactEmail: transaction.contactEmail,
          productName: transaction.productName,
          amountLabel: transaction.amountLabel,
          amount: transaction.amount,
          createdAt: transaction.createdAt,
          statusCode: transaction.statusCode,
          statusLabel: transaction.statusLabel,
          paymentMethod: transaction.paymentMethod,
          paymentMethodLabel: transaction.paymentMethodLabel,
        })),
        defaultPageSize: DEFAULT_PAGINATION_LIMIT,
        guruConfigured: Boolean(
          process.env.GURU_USER_TOKEN?.trim() &&
            !process.env.GURU_USER_TOKEN?.trim().startsWith("cole-o-"),
        ),
        period,
        dateFrom,
        dateTo,
        periodLabel: formatPeriodLabel(period, dateFrom, dateTo),
        availableStatuses,
      };
    },
    [CACHE_TAGS.SALES_OVERVIEW, periodKey],
    {
      revalidate: 60,
      tags: [CACHE_TAGS.SALES_OVERVIEW],
    },
  )();
}

export const salesService = {
  async getOverview(params?: SalesOverviewParams): Promise<SalesOverview> {
    const { period, dateFrom, dateTo, cacheKey } = resolveSalesPeriod(params);
    const normalizedKey = `${period}:${dateFrom}:${dateTo}`;
    return getCachedSalesOverview(normalizedKey || cacheKey, dateFrom, dateTo);
  },
};
