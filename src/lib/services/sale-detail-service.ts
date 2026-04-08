import { getCompanySnapshot } from "@/lib/company-snapshot";
import { getGuruTransactionById } from "@/lib/services/guru-transactions-client";
import type { SaleDetailOverview } from "@/types/sales";

function formatCurrency(value: number | null | undefined, currency = "BRL") {
  if (value == null || !Number.isFinite(value)) {
    return "0,00";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  })
    .format(value)
    .replace(/^R\$\s?/, "");
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function formatPhone(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return value;
}

export const saleDetailService = {
  async getOverview(saleId: string): Promise<SaleDetailOverview | null> {
    const sale = await getGuruTransactionById(saleId);

    if (!sale) {
      return null;
    }

    const raw = sale.rawPayload as
      | {
          payment?: {
            currency?: string | null;
            method?: string | null;
            installments?: {
              qty?: number | string | null;
              value?: number | string | null;
              interest?: number | string | null;
            } | null;
            total?: number | string | null;
            net?: number | string | null;
            gross?: number | string | null;
            affiliate_value?: number | string | null;
            discount_value?: number | string | null;
            marketplace_value?: number | string | null;
            refund_reason?: string | null;
            refuse_reason?: string | null;
            tax?: {
              value?: number | string | null;
            } | null;
          } | null;
          dates?: {
            created_at?: number | string | null;
            confirmed_at?: number | string | null;
            canceled_at?: number | string | null;
          } | null;
          contact?: {
            name?: string | null;
            email?: string | null;
            doc?: string | null;
            phone_local_code?: string | null;
            phone_number?: string | null;
            address?: string | null;
            address_number?: string | null;
            address_comp?: string | null;
            address_district?: string | null;
            address_city?: string | null;
            address_state?: string | null;
            address_country?: string | null;
            address_zip_code?: string | null;
          } | null;
          items?: Array<{
            qty?: number | string | null;
            unit_value?: number | string | null;
            total_value?: number | string | null;
            name?: string | null;
            marketplace_name?: string | null;
            marketplace_id?: string | null;
            offer?: { name?: string | null } | null;
            producer?: { name?: string | null } | null;
          }> | null;
          product?: {
            name?: string | null;
            unit_value?: number | string | null;
            total_value?: number | string | null;
            qty?: number | string | null;
            marketplace_name?: string | null;
            marketplace_id?: string | null;
            offer?: { name?: string | null } | null;
            producer?: { name?: string | null } | null;
          } | null;
          trackings?: {
            source?: string | null;
            checkout_source?: string | null;
            utm_source?: string | null;
            utm_campaign?: string | null;
            utm_medium?: string | null;
            utm_content?: string | null;
            utm_term?: string | null;
          } | null;
          infrastructure?: {
            ip?: string | null;
            country?: string | null;
            region?: string | null;
            city?: string | null;
            city_lat_long?: string | null;
            user_agent?: string | null;
          } | null;
          extras?: {
            accepted_terms_url?: number | string | null;
            accepted_privacy_policy_url?: number | string | null;
          } | null;
          shipping?: {
            value?: number | string | null;
          } | null;
          checkout_url?: string | null;
        }
      | null;

    const currency = raw?.payment?.currency ?? sale.currency ?? "BRL";
    const paymentMethod = sale.paymentMethod ?? raw?.payment?.method ?? null;
    const installmentsQty = raw?.payment?.installments?.qty;
    const installmentsValue = raw?.payment?.installments?.value;
    const installmentsLabel =
      installmentsQty && installmentsValue != null
        ? `${installmentsQty} x ${formatCurrency(Number(installmentsValue), currency)}`
        : null;

    const firstItem = raw?.items?.[0] ?? null;
    const productUnitValue = Number(firstItem?.unit_value ?? raw?.product?.unit_value ?? 0);
    const productTotalValue = Number(firstItem?.total_value ?? raw?.product?.total_value ?? sale.amount ?? 0);
    const productQty = String(firstItem?.qty ?? raw?.product?.qty ?? 1);

    const reason =
      raw?.payment?.refuse_reason?.trim() ||
      raw?.payment?.refund_reason?.trim() ||
      null;

    return {
      company: getCompanySnapshot(),
      sale: {
        id: sale.id,
        code: sale.code,
        statusCode: sale.statusCode,
        statusLabel: sale.statusLabel,
        currency,
        createdAt: formatDate(sale.createdAt),
        approvedAt: formatDate(sale.approvedAt),
        canceledAt: formatDate(sale.canceledAt),
        reason,
        paymentMethod,
        paymentMethodLabel: sale.paymentMethodLabel,
        installmentsLabel,
        productAmountLabel: formatCurrency(productTotalValue, currency),
        shippingFeeLabel: formatCurrency(Number(raw?.shipping?.value ?? 0), currency),
        discountValueLabel: formatCurrency(Number(raw?.payment?.discount_value ?? 0), currency),
        taxValueLabel: formatCurrency(Number(raw?.payment?.tax?.value ?? 0), currency),
        affiliateValueLabel: formatCurrency(Number(raw?.payment?.affiliate_value ?? 0), currency),
        marketplaceValueLabel: formatCurrency(Number(raw?.payment?.marketplace_value ?? 0), currency),
        totalLabel: formatCurrency(Number(raw?.payment?.total ?? sale.amount ?? 0), currency),
        netLabel: formatCurrency(Number(raw?.payment?.net ?? sale.amount ?? 0), currency),
        checkoutUrl: raw?.checkout_url ?? null,
        buyer: {
          name: raw?.contact?.name ?? sale.contactName,
          email: raw?.contact?.email ?? sale.contactEmail,
          document: raw?.contact?.doc ?? null,
          phone: formatPhone(
            raw?.contact?.phone_local_code && raw?.contact?.phone_number
              ? `${raw.contact.phone_local_code}${raw.contact.phone_number}`
              : raw?.contact?.phone_number ?? null,
          ),
          country: raw?.contact?.address_country ?? null,
          street: raw?.contact?.address ?? null,
          number: raw?.contact?.address_number ?? null,
          complement: raw?.contact?.address_comp ?? null,
          district: raw?.contact?.address_district ?? null,
          city: raw?.contact?.address_city ?? null,
          state: raw?.contact?.address_state ?? null,
          zipcode: raw?.contact?.address_zip_code ?? null,
        },
        product: {
          unitValueLabel: formatCurrency(productUnitValue, currency),
          quantity: productQty,
          totalValueLabel: formatCurrency(productTotalValue, currency),
          name: raw?.product?.name ?? sale.productName,
          offerName: firstItem?.offer?.name ?? raw?.product?.offer?.name ?? null,
          marketplaceName: firstItem?.marketplace_name ?? raw?.product?.marketplace_name ?? null,
          marketplaceId: firstItem?.marketplace_id ?? raw?.product?.marketplace_id ?? null,
          producerName: firstItem?.producer?.name ?? raw?.product?.producer?.name ?? null,
        },
        extras: {
          source: raw?.trackings?.source ?? null,
          checkoutSource: raw?.trackings?.checkout_source ?? null,
          utmSource: raw?.trackings?.utm_source ?? null,
          utmCampaign: raw?.trackings?.utm_campaign ?? null,
          utmMedium: raw?.trackings?.utm_medium ?? null,
          utmContent: raw?.trackings?.utm_content ?? null,
          utmTerm: raw?.trackings?.utm_term ?? null,
          ip: raw?.infrastructure?.ip ?? null,
          country: raw?.infrastructure?.country ?? null,
          region: raw?.infrastructure?.region ?? null,
          city: raw?.infrastructure?.city ?? null,
          latitudeLongitude: raw?.infrastructure?.city_lat_long ?? null,
          userAgent: raw?.infrastructure?.user_agent ?? null,
          acceptedTerms: raw?.extras?.accepted_terms_url != null ? String(raw.extras.accepted_terms_url) : null,
          acceptedPrivacyPolicy:
            raw?.extras?.accepted_privacy_policy_url != null
              ? String(raw.extras.accepted_privacy_policy_url)
              : null,
        },
      },
    };
  },
};
