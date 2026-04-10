import { unstable_cache } from "next/cache";

import { getCompanySnapshot } from "@/lib/company-snapshot";
import { CACHE_TAGS } from "@/lib/constants";
import { getGuruContactById } from "@/lib/services/guru-contacts-client";
import {
  getAllGuruTransactions,
  getGuruTransactionsByContactId,
} from "@/lib/services/guru-transactions-client";
import type {
  TraderEticketRecord,
  TraderProfileOverview,
  TraderSaleRecord,
} from "@/types/traders";

function formatDisplayDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function filterTraderSales(
  sales: Awaited<ReturnType<typeof getAllGuruTransactions>>,
  trader: Awaited<ReturnType<typeof getGuruContactById>>,
) {
  if (!trader) {
    return [];
  }

  const traderId = trader.id?.trim() || null;
  const traderEmail = normalizeText(trader.email);
  const traderDocument = (trader.document ?? "").replace(/\D/g, "");
  const traderName = normalizeText(trader.name);

  return sales.filter((sale) => {
    const saleId = sale.contactId?.trim() || null;
    const saleEmail = normalizeText(sale.contactEmail);
    const saleDocument = (sale.contactDocument ?? "").replace(/\D/g, "");
    const saleName = normalizeText(sale.contactName);

    if (traderId && saleId === traderId) {
      return true;
    }

    if (traderEmail && saleEmail === traderEmail) {
      return true;
    }

    if (traderDocument && saleDocument && saleDocument === traderDocument) {
      return true;
    }

    if (traderName && saleName === traderName) {
      return true;
    }

    return false;
  });
}

export const traderProfileService = {
  async getOverview(contactId: string): Promise<TraderProfileOverview | null> {
    const normalizedContactId = contactId.trim();

    if (!normalizedContactId) {
      return null;
    }

    return unstable_cache(
      async (): Promise<TraderProfileOverview | null> => {
        const trader = await getGuruContactById(normalizedContactId);

        if (!trader) {
          return null;
        }

        const directSalesSnapshots = trader.id
          ? await getGuruTransactionsByContactId(trader.id).catch((error) => {
              console.warn("[guru-transactions] falha ao consultar vendas por contact_id", error);
              return [];
            })
          : [];

        const fallbackSalesSnapshots =
          directSalesSnapshots.length === 0
            ? await getAllGuruTransactions().catch((error) => {
                console.warn("[guru-transactions] falha ao consultar snapshot geral de vendas", error);
                return [];
              })
            : [];

        const mergedSalesSnapshots = Array.from(
          new Map(
            [
              ...directSalesSnapshots,
              ...filterTraderSales(fallbackSalesSnapshots, trader),
            ].map((sale) => [sale.code || sale.id, sale]),
          ).values(),
        ).sort((left, right) => {
          const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
          const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
          return rightTime - leftTime;
        });

        const sales: TraderSaleRecord[] = mergedSalesSnapshots.map((sale) => ({
          id: sale.id,
          code: sale.code,
          productName: sale.productName,
          createdAt: formatDisplayDate(sale.createdAt),
          amountLabel: sale.amountLabel,
          statusLabel: sale.statusLabel,
        }));

        const etickets: TraderEticketRecord[] = [];

        return {
          company: getCompanySnapshot(),
          trader: {
            id: trader.id,
            name: trader.name,
            email: trader.email || "Sem e-mail",
            phone: trader.phone || "Sem telefone",
            document: trader.document || "Sem documento",
            street: trader.street,
            number: trader.number,
            complement: trader.complement,
            district: trader.district,
            zipcode: trader.zipcode,
            city: trader.city,
            state: trader.state,
            country: trader.country,
            regionLabel: trader.regionLabel,
            createdAt: trader.createdAt,
          },
          sales,
          etickets,
          commentsCount: 0,
          auditCount: 0,
        };
      },
      [CACHE_TAGS.TRADER_PROFILE, normalizedContactId],
      {
        revalidate: 60,
        tags: [CACHE_TAGS.TRADER_PROFILE, CACHE_TAGS.TRADERS_OVERVIEW, CACHE_TAGS.SALES_OVERVIEW],
      },
    )();
  },
};
