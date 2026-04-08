import { cache } from "react";
import { z } from "zod";

import { CACHE_TAGS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { SalesPeriodPreset } from "@/types/sales";

const stringishValueSchema = z
  .union([z.string(), z.number(), z.boolean()])
  .transform((value) => String(value));

const nullableStringishValueSchema = z
  .union([z.string(), z.number(), z.boolean(), z.null(), z.undefined()])
  .transform((value) => (value == null ? null : String(value)));

const guruTransactionSchema = z
  .object({
    id: stringishValueSchema,
    checkout_url: nullableStringishValueSchema.optional(),
    type: nullableStringishValueSchema.optional(),
    value: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
    status: nullableStringishValueSchema.optional(),
    payment_method: nullableStringishValueSchema.optional(),
    installments: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
    transaction_fee: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
    shipping_fee: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
    net_value: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
    source: nullableStringishValueSchema.optional(),
    checkout_source: nullableStringishValueSchema.optional(),
    utm_source: nullableStringishValueSchema.optional(),
    utm_campaign: nullableStringishValueSchema.optional(),
    utm_medium: nullableStringishValueSchema.optional(),
    utm_content: nullableStringishValueSchema.optional(),
    utm_term: nullableStringishValueSchema.optional(),
    billet_url: nullableStringishValueSchema.optional(),
    billet_line: nullableStringishValueSchema.optional(),
    ordered_at: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
    approved_at: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
    created_at: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
    dates: z
      .object({
        ordered_at: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
        confirmed_at: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
        canceled_at: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
        created_at: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
      })
      .nullable()
      .optional(),
    product: z
      .object({
        id: nullableStringishValueSchema.optional(),
        name: nullableStringishValueSchema.optional(),
        total_value: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
        unit_value: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
        qty: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
        offer: z
          .object({
            id: nullableStringishValueSchema.optional(),
            name: nullableStringishValueSchema.optional(),
          })
          .nullable()
          .optional(),
      })
      .nullable()
      .optional(),
    contact: z
      .object({
        id: nullableStringishValueSchema.optional(),
        email: nullableStringishValueSchema.optional(),
        name: nullableStringishValueSchema.optional(),
        doc: nullableStringishValueSchema.optional(),
        company_name: nullableStringishValueSchema.optional(),
        phone_local_code: nullableStringishValueSchema.optional(),
        phone_number: nullableStringishValueSchema.optional(),
        address: nullableStringishValueSchema.optional(),
        address_number: nullableStringishValueSchema.optional(),
        address_comp: nullableStringishValueSchema.optional(),
        address_district: nullableStringishValueSchema.optional(),
        address_city: nullableStringishValueSchema.optional(),
        address_state: nullableStringishValueSchema.optional(),
        address_state_full_name: nullableStringishValueSchema.optional(),
        address_country: nullableStringishValueSchema.optional(),
        address_zip_code: nullableStringishValueSchema.optional(),
      })
      .nullable()
      .optional(),
    buyer: z
      .object({
        id: nullableStringishValueSchema.optional(),
        email: nullableStringishValueSchema.optional(),
        name: nullableStringishValueSchema.optional(),
        doc: nullableStringishValueSchema.optional(),
        phone_local_code: nullableStringishValueSchema.optional(),
        phone_number: nullableStringishValueSchema.optional(),
      })
      .nullable()
      .optional(),
    payment: z
      .object({
        marketplace_id: nullableStringishValueSchema.optional(),
        marketplace_name: nullableStringishValueSchema.optional(),
        currency: nullableStringishValueSchema.optional(),
        total: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
        net: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
        gross: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
        affiliate_value: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
        discount_value: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
        marketplace_value: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
        method: nullableStringishValueSchema.optional(),
        refund_reason: nullableStringishValueSchema.optional(),
        refuse_reason: nullableStringishValueSchema.optional(),
        installments: z
          .object({
            value: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
            qty: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
            interest: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
          })
          .nullable()
          .optional(),
        tax: z
          .object({
            value: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
            rate: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
          })
          .nullable()
          .optional(),
        acquirer: z
          .object({
            code: nullableStringishValueSchema.optional(),
            message: nullableStringishValueSchema.optional(),
            name: nullableStringishValueSchema.optional(),
            nsu: nullableStringishValueSchema.optional(),
            tid: nullableStringishValueSchema.optional(),
          })
          .nullable()
          .optional(),
        credit_card: z
          .object({
            brand: nullableStringishValueSchema.optional(),
            first_digits: nullableStringishValueSchema.optional(),
            last_digits: nullableStringishValueSchema.optional(),
          })
          .nullable()
          .optional(),
      })
      .nullable()
      .optional(),
    items: z
      .array(
        z
          .object({
            id: nullableStringishValueSchema.optional(),
            name: nullableStringishValueSchema.optional(),
            qty: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
            total_value: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
            unit_value: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
            offer: z
              .object({
                id: nullableStringishValueSchema.optional(),
                name: nullableStringishValueSchema.optional(),
              })
              .nullable()
              .optional(),
          })
          .passthrough(),
      )
      .optional()
      .default([]),
    invoice: z
      .union([
        z.array(z.unknown()),
        z.object({ marketplace_id: nullableStringishValueSchema.optional() }).passthrough(),
        z.null(),
        z.undefined(),
      ])
      .optional(),
    subscription: z
      .union([
        z.array(z.unknown()),
        z.object({ marketplace_id: nullableStringishValueSchema.optional() }).passthrough(),
        z.null(),
        z.undefined(),
      ])
      .optional(),
    extras: z
      .object({
        accepted_terms_url: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
        accepted_privacy_policy_url: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
      })
      .nullable()
      .optional(),
    infrastructure: z
      .object({
        ip: nullableStringishValueSchema.optional(),
        city: nullableStringishValueSchema.optional(),
        region: nullableStringishValueSchema.optional(),
        country: nullableStringishValueSchema.optional(),
        user_agent: nullableStringishValueSchema.optional(),
        city_lat_long: nullableStringishValueSchema.optional(),
      })
      .nullable()
      .optional(),
    trackings: z
      .object({
        source: nullableStringishValueSchema.optional(),
        checkout_source: nullableStringishValueSchema.optional(),
        utm_source: nullableStringishValueSchema.optional(),
        utm_campaign: nullableStringishValueSchema.optional(),
        utm_medium: nullableStringishValueSchema.optional(),
        utm_content: nullableStringishValueSchema.optional(),
        utm_term: nullableStringishValueSchema.optional(),
      })
      .nullable()
      .optional(),
    shipping: z
      .object({
        name: nullableStringishValueSchema.optional(),
        value: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional(),
      })
      .nullable()
      .optional(),
  })
  .passthrough();

const guruTransactionListSchema = z
  .object({
    data: z.array(guruTransactionSchema).default([]),
    has_more_pages: z.coerce.number().optional(),
    next_cursor: z.string().nullable().optional(),
  })
  .passthrough();

export type GuruTransactionSnapshot = {
  id: string;
  code: string;
  contactId: string | null;
  contactName: string;
  contactEmail: string | null;
  contactDocument: string | null;
  productName: string;
  amount: number | null;
  amountLabel: string;
  createdAt: string | null;
  approvedAt: string | null;
  canceledAt: string | null;
  currency: string | null;
  statusCode: string | null;
  statusLabel: string | null;
  paymentMethod: string | null;
  paymentMethodLabel: string | null;
  rawPayload: z.infer<typeof guruTransactionSchema> | null;
};

export type GuruTransactionRange = {
  dateFrom?: string | null;
  dateTo?: string | null;
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  billet_printed: "Boleto impresso",
  approved: "Aprovada",
  canceled: "Cancelada",
  chargeback: "Chargeback",
  completed: "Completa",
  dispute: "Reembolso solicitado",
  refunded: "Reembolsada",
  abandoned: "Abandonada",
  waiting_payment: "Aguardando pagamento",
  in_analysis: "Em análise",
  expired: "Expirada",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  billet: "Boleto Bancário",
  credit_card: "Cartão de Crédito",
  paypal: "PayPal",
  bank_transfer: "Débito Bancário",
  other: "Outro",
  pix: "Pix",
};

function getTransactionStatusLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return TRANSACTION_STATUS_LABELS[value] ?? value.replaceAll("_", " ");
}

function getPaymentMethodLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return PAYMENT_METHOD_LABELS[value] ?? value.replaceAll("_", " ");
}

function getGuruUserToken() {
  const token = process.env.GURU_USER_TOKEN?.trim() || null;

  if (!token || token.startsWith("cole-o-")) {
    return null;
  }

  return token;
}

function parseGuruTimestamp(value: string | number | null | undefined) {
  if (value == null) {
    return null;
  }

  const numeric = typeof value === "string" ? Number(value) : value;
  if (Number.isFinite(numeric) && Number(numeric) > 0) {
    const timestamp = Number(numeric) > 9999999999 ? Number(numeric) : Number(numeric) * 1000;
    return new Date(timestamp);
  }

  if (typeof value === "string") {
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime())) {
      return asDate;
    }
  }

  return null;
}

function formatAmount(value: string | number | null | undefined) {
  const numeric = typeof value === "string" ? Number(value) : value;

  if (numeric == null || !Number.isFinite(numeric)) {
    return {
      amount: null,
      amountLabel: "Sem valor",
    };
  }

  return {
    amount: Number(numeric),
    amountLabel: new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(numeric)),
  };
}

function toNumber(value: string | number | null | undefined) {
  const numeric = typeof value === "string" ? Number(value) : value;
  return numeric == null || !Number.isFinite(numeric) ? null : Number(numeric);
}

function resolveTransactionAmount(transaction: z.infer<typeof guruTransactionSchema>) {
  return (
    toNumber(transaction.payment?.total) ??
    toNumber(transaction.payment?.net) ??
    toNumber(transaction.payment?.gross) ??
    transaction.items.reduce<number | null>((total, item) => {
      const itemTotal = toNumber(item.total_value) ?? toNumber(item.unit_value);
      if (itemTotal == null) {
        return total;
      }
      return (total ?? 0) + itemTotal;
    }, null) ??
    toNumber(transaction.product?.total_value) ??
    toNumber(transaction.product?.unit_value) ??
    toNumber(transaction.value)
  );
}

function resolveTransactionCode(transaction: z.infer<typeof guruTransactionSchema>) {
  return (
    transaction.payment?.marketplace_id?.trim() ||
    (Array.isArray(transaction.invoice)
      ? null
      : transaction.invoice?.marketplace_id?.trim()) ||
    (Array.isArray(transaction.subscription)
      ? null
      : transaction.subscription?.marketplace_id?.trim()) ||
    transaction.id
  );
}

function resolveProductName(transaction: z.infer<typeof guruTransactionSchema>) {
  const items = transaction.items ?? [];

  if (items.length > 0) {
    return items
      .map((item) => {
        const quantity = toNumber(item.qty) ?? 1;
        const label =
          item.offer?.name?.trim() ||
          item.name?.trim() ||
          transaction.product?.offer?.name?.trim() ||
          transaction.product?.name?.trim() ||
          "Produto nao informado";

        return `${quantity} x ${label}`;
      })
      .join(" + ");
  }

  return (
    transaction.product?.offer?.name?.trim() ||
    transaction.product?.name?.trim() ||
    "Produto nao informado"
  );
}

function toIsoDate(value: Date | null) {
  if (!value) {
    return null;
  }

  return value.toISOString().slice(0, 10);
}

function parseDateOnlyInput(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
}

function endOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
}

function normalizeRange({ dateFrom, dateTo }: GuruTransactionRange) {
  const now = new Date();
  const defaultEnd = endOfDay(now);
  const defaultStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));

  const parsedStart = parseDateOnlyInput(dateFrom);
  const parsedEnd = parseDateOnlyInput(dateTo);

  if (!parsedStart && !parsedEnd) {
    return {
      start: defaultStart,
      end: defaultEnd,
      cacheKey: `${toIsoDate(defaultStart)}:${toIsoDate(defaultEnd)}`,
    };
  }

  const start = startOfDay(parsedStart ?? parsedEnd ?? defaultStart);
  const end = endOfDay(parsedEnd ?? parsedStart ?? defaultEnd);

  if (start.getTime() <= end.getTime()) {
    return {
      start,
      end,
      cacheKey: `${toIsoDate(start)}:${toIsoDate(end)}`,
    };
  }

  return {
    start: startOfDay(end),
    end: endOfDay(start),
    cacheKey: `${toIsoDate(end)}:${toIsoDate(start)}`,
  };
}

function buildDateWindows(start: Date, end: Date) {
  const windows: Array<{ start: Date; end: Date }> = [];
  let cursor = new Date(end);

  while (cursor.getTime() >= start.getTime()) {
    const windowEnd = endOfDay(cursor);
    const windowStart = startOfDay(new Date(cursor));
    windowStart.setDate(windowStart.getDate() - 179);

    if (windowStart.getTime() < start.getTime()) {
      windowStart.setTime(start.getTime());
    }

    windows.push({ start: new Date(windowStart), end: new Date(windowEnd) });

    const nextCursor = new Date(windowStart);
    nextCursor.setDate(nextCursor.getDate() - 1);
    cursor = nextCursor;
  }

  return windows;
}

function isWithinRange(value: string | null, start: Date, end: Date) {
  if (!value) {
    return false;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.getTime() >= start.getTime() && parsed.getTime() <= end.getTime();
}

function buildTransactionSnapshot(transaction: z.infer<typeof guruTransactionSchema>) {
  const { amount, amountLabel } = formatAmount(resolveTransactionAmount(transaction));
  const orderedAt = parseGuruTimestamp(transaction.dates?.ordered_at)?.toISOString() ?? null;
  const approvedAt =
    parseGuruTimestamp(transaction.dates?.confirmed_at)?.toISOString() ??
    parseGuruTimestamp(transaction.approved_at)?.toISOString() ??
    null;
  const canceledAt =
    parseGuruTimestamp(transaction.dates?.canceled_at)?.toISOString() ??
    null;
  const createdAt =
    orderedAt ??
    canceledAt ??
    approvedAt ??
    parseGuruTimestamp(transaction.dates?.created_at)?.toISOString() ??
    parseGuruTimestamp(transaction.created_at)?.toISOString() ??
    null;
  const paymentMethod = transaction.payment?.method ?? transaction.payment_method ?? null;

  return {
    id: transaction.id,
    code: resolveTransactionCode(transaction),
    contactId: transaction.contact?.id?.trim() || null,
    contactName: transaction.contact?.name?.trim() || "Contato nao informado",
    contactEmail: transaction.contact?.email?.trim().toLowerCase() || null,
    contactDocument: transaction.contact?.doc?.trim() || null,
    productName: resolveProductName(transaction),
    amount,
    amountLabel,
    createdAt,
    approvedAt,
    canceledAt,
    currency: transaction.payment?.currency ?? null,
    statusCode: transaction.status ?? null,
    statusLabel: getTransactionStatusLabel(transaction.status ?? null),
    paymentMethod,
    paymentMethodLabel: getPaymentMethodLabel(paymentMethod),
    rawPayload: transaction,
  } satisfies GuruTransactionSnapshot;
}

function buildPersistedTransactionSnapshot(
  transaction: Awaited<ReturnType<typeof prisma.guruTransactionSnapshot.findMany>>[number],
) {
  const parsedRaw = guruTransactionSchema.safeParse(transaction.rawPayload);
  if (parsedRaw.success) {
    const snapshot = buildTransactionSnapshot(parsedRaw.data);
    return {
      ...snapshot,
      id: transaction.guruTransactionId,
      code: transaction.guruTransactionCode || snapshot.code,
      contactId: transaction.guruContactId ?? snapshot.contactId,
      contactName: transaction.contactName || snapshot.contactName,
      contactEmail: transaction.contactEmail ?? snapshot.contactEmail,
      contactDocument: transaction.contactDocument ?? snapshot.contactDocument,
      productName: transaction.productName || snapshot.productName,
      amount: transaction.amount == null ? snapshot.amount : Number(transaction.amount),
      amountLabel:
        transaction.amount == null
          ? snapshot.amountLabel
          : formatAmount(Number(transaction.amount)).amountLabel,
      approvedAt: transaction.confirmedAt?.toISOString() ?? snapshot.approvedAt,
      canceledAt: transaction.canceledAt?.toISOString() ?? snapshot.canceledAt,
      createdAt:
        transaction.orderedAt?.toISOString() ??
        transaction.confirmedAt?.toISOString() ??
        transaction.canceledAt?.toISOString() ??
        snapshot.createdAt,
      currency: transaction.currency ?? snapshot.currency,
      statusCode: transaction.status ?? snapshot.statusCode,
      statusLabel: getTransactionStatusLabel(transaction.status ?? snapshot.statusCode),
      rawPayload: parsedRaw.data,
    } satisfies GuruTransactionSnapshot;
  }

  const amount = transaction.amount == null ? null : Number(transaction.amount);
  const { amountLabel } = formatAmount(amount);
  const createdAt =
    transaction.orderedAt?.toISOString() ??
    transaction.confirmedAt?.toISOString() ??
    transaction.canceledAt?.toISOString() ??
    null;

  return {
    id: transaction.guruTransactionId,
    code: transaction.guruTransactionCode || transaction.guruTransactionId,
    contactId: transaction.guruContactId,
    contactName: transaction.contactName,
    contactEmail: transaction.contactEmail,
    contactDocument: transaction.contactDocument,
    productName: transaction.productName,
    amount,
    amountLabel,
    createdAt,
    approvedAt: transaction.confirmedAt?.toISOString() ?? null,
    canceledAt: transaction.canceledAt?.toISOString() ?? null,
    currency: transaction.currency,
    statusCode: transaction.status,
    statusLabel: getTransactionStatusLabel(transaction.status),
    paymentMethod: null,
    paymentMethodLabel: null,
    rawPayload: null,
  } satisfies GuruTransactionSnapshot;
}

async function getPersistedGuruTransactions(range?: GuruTransactionRange) {
  const normalizedRange = range ? normalizeRange(range) : null;
  const transactions = await prisma.guruTransactionSnapshot.findMany({
    where: normalizedRange
      ? {
          OR: [
            {
              orderedAt: {
                gte: normalizedRange.start,
                lte: normalizedRange.end,
              },
            },
            {
              confirmedAt: {
                gte: normalizedRange.start,
                lte: normalizedRange.end,
              },
            },
            {
              canceledAt: {
                gte: normalizedRange.start,
                lte: normalizedRange.end,
              },
            },
            {
              createdAt: {
                gte: normalizedRange.start,
                lte: normalizedRange.end,
              },
            },
          ],
        }
      : undefined,
    orderBy: [
      { orderedAt: "desc" },
      { confirmedAt: "desc" },
      { canceledAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  return transactions.map(buildPersistedTransactionSnapshot);
}

async function requestGuruTransactionsByContactRoute(contactId: string) {
  const guruUserToken = getGuruUserToken();

  if (!guruUserToken) {
    return [] as GuruTransactionSnapshot[];
  }

  const normalizedContactId = contactId.trim();

  if (!normalizedContactId) {
    return [] as GuruTransactionSnapshot[];
  }

  const baseUrl = process.env.GURU_API_BASE_URL || "https://digitalmanager.guru/api/v2";
  const transactions: GuruTransactionSnapshot[] = [];
  let cursor: string | null | undefined = undefined;
  let safetyCounter = 0;

  do {
    const searchParams = new URLSearchParams();
    if (cursor) {
      searchParams.set("cursor", cursor);
    }

    const requestUrl = searchParams.toString()
      ? `${baseUrl}/contacts/${encodeURIComponent(normalizedContactId)}/transactions?${searchParams.toString()}`
      : `${baseUrl}/contacts/${encodeURIComponent(normalizedContactId)}/transactions`;

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${guruUserToken}`,
      },
      next: {
        revalidate: 60,
        tags: [CACHE_TAGS.SALES_OVERVIEW],
      },
    });

    if (!response.ok) {
      throw new Error(
        `[Guru] HTTP ${response.status} ao consultar contacts/${normalizedContactId}/transactions.`,
      );
    }

    const payload = guruTransactionListSchema.parse(await response.json());
    transactions.push(...payload.data.map(buildTransactionSnapshot));

    cursor = payload.has_more_pages ? payload.next_cursor : null;
    safetyCounter += 1;
  } while (cursor && safetyCounter < 20);

  return transactions.sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

async function requestGuruTransactionsByContactFilter(contactId: string) {
  const guruUserToken = getGuruUserToken();

  if (!guruUserToken) {
    return [] as GuruTransactionSnapshot[];
  }

  const normalizedContactId = contactId.trim();

  if (!normalizedContactId) {
    return [] as GuruTransactionSnapshot[];
  }

  const baseUrl = process.env.GURU_API_BASE_URL || "https://digitalmanager.guru/api/v2";
  const transactions: GuruTransactionSnapshot[] = [];
  let cursor: string | null | undefined = undefined;
  let safetyCounter = 0;

  do {
    const searchParams = new URLSearchParams();
    searchParams.set("contact_id", normalizedContactId);
    if (cursor) {
      searchParams.set("cursor", cursor);
    }

    const response = await fetch(`${baseUrl}/transactions?${searchParams.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${guruUserToken}`,
      },
      next: {
        revalidate: 60,
        tags: [CACHE_TAGS.SALES_OVERVIEW],
      },
    });

    if (!response.ok) {
      throw new Error(
        `[Guru] HTTP ${response.status} ao consultar transactions com contact_id=${normalizedContactId}.`,
      );
    }

    const payload = guruTransactionListSchema.parse(await response.json());
    transactions.push(...payload.data.map(buildTransactionSnapshot));

    cursor = payload.has_more_pages ? payload.next_cursor : null;
    safetyCounter += 1;
  } while (cursor && safetyCounter < 20);

  return transactions.sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

async function requestGuruTransactionById(transactionId: string) {
  const guruUserToken = getGuruUserToken();

  if (!guruUserToken || !transactionId.trim()) {
    return null;
  }

  const baseUrl = process.env.GURU_API_BASE_URL || "https://digitalmanager.guru/api/v2";
  const response = await fetch(`${baseUrl}/transactions/${transactionId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${guruUserToken}`,
    },
    next: {
      revalidate: 60,
      tags: [CACHE_TAGS.SALES_OVERVIEW],
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`[Guru] HTTP ${response.status} ao consultar transaction ${transactionId}.`);
  }

  const payload = guruTransactionSchema.parse(await response.json());
  return buildTransactionSnapshot(payload);
}

async function requestGuruTransactionsByWindow(
  field: "ordered_at" | "cancelled_at" | "confirmed_at",
  startDate: Date,
  endDate: Date,
) {
  const guruUserToken = getGuruUserToken();

  if (!guruUserToken) {
    return [] as GuruTransactionSnapshot[];
  }

  const start = toIsoDate(startDate);
  const end = toIsoDate(endDate);

  if (!start || !end) {
    return [] as GuruTransactionSnapshot[];
  }

  const baseUrl = process.env.GURU_API_BASE_URL || "https://digitalmanager.guru/api/v2";
  const transactions: GuruTransactionSnapshot[] = [];
  let cursor: string | null | undefined = undefined;
  let safetyCounter = 0;

  do {
    const searchParams = new URLSearchParams({
      [`${field}_ini`]: start,
      [`${field}_end`]: end,
    });

    if (cursor) {
      searchParams.set("cursor", cursor);
    }

    const response = await fetch(`${baseUrl}/transactions?${searchParams.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${guruUserToken}`,
      },
      next: {
        revalidate: 60,
        tags: [CACHE_TAGS.SALES_OVERVIEW],
      },
    });

    if (!response.ok) {
      throw new Error(
        `[Guru] HTTP ${response.status} ao consultar transactions por ${field} entre ${start} e ${end}.`,
      );
    }

    const payload = guruTransactionListSchema.parse(await response.json());
    transactions.push(...payload.data.map(buildTransactionSnapshot));

    cursor = payload.has_more_pages ? payload.next_cursor : null;
    safetyCounter += 1;
  } while (cursor && safetyCounter < 20);

  return transactions;
}

export const getGuruTransactionsByContactId = cache(async (contactId: string) => {
  const [contactRouteTransactions, contactFilterTransactions, persistedTransactions] = await Promise.all([
    requestGuruTransactionsByContactRoute(contactId).catch((error) => {
      console.warn(
        "[guru-transactions] falha ao consultar contacts/{id}/transactions",
        error,
      );
      return [];
    }),
    requestGuruTransactionsByContactFilter(contactId).catch((error) => {
      console.warn(
        "[guru-transactions] falha ao consultar transactions?contact_id={id}",
        error,
      );
      return [];
    }),
    getPersistedGuruTransactions(),
  ]);

  const deduped = new Map<string, GuruTransactionSnapshot>();

  for (const transaction of [
    ...persistedTransactions.filter((item) => item.contactId === contactId),
    ...contactFilterTransactions,
    ...contactRouteTransactions,
  ]) {
    deduped.set(transaction.code || transaction.id, transaction);
  }

  return Array.from(deduped.values()).sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });
});

export const getGuruTransactionsByRange = cache(async (range?: GuruTransactionRange) => {
  const normalizedRange = normalizeRange(range ?? {});
  const windows = buildDateWindows(normalizedRange.start, normalizedRange.end);

  const groupedTransactions = await Promise.all(
    windows.flatMap(({ start, end }) =>
      (["ordered_at", "cancelled_at", "confirmed_at"] as const).map((field) =>
        requestGuruTransactionsByWindow(field, start, end).catch((error) => {
          console.warn("[guru-transactions] falha ao consultar janela de vendas", {
            error,
            field,
            start: toIsoDate(start),
            end: toIsoDate(end),
          });
          return [];
        }),
      ),
    ),
  );

  const deduped = new Map<string, GuruTransactionSnapshot>();
  const persistedTransactions = await getPersistedGuruTransactions({
    dateFrom: toIsoDate(normalizedRange.start),
    dateTo: toIsoDate(normalizedRange.end),
  }).catch((error) => {
    console.warn("[guru-transactions] falha ao consultar snapshots persistidos", error);
    return [];
  });

  for (const transaction of persistedTransactions) {
    deduped.set(transaction.code || transaction.id, transaction);
  }

  for (const group of groupedTransactions) {
    for (const transaction of group) {
      deduped.set(transaction.code || transaction.id, transaction);
    }
  }

  return Array.from(deduped.values())
    .filter((transaction) => isWithinRange(transaction.createdAt, normalizedRange.start, normalizedRange.end))
    .filter((transaction, index, collection) => {
      if (!transaction.contactEmail && !transaction.contactDocument) {
        return true;
      }

      const key = [
        normalizeText(transaction.contactEmail),
        (transaction.contactDocument ?? "").replace(/\D/g, ""),
        normalizeText(transaction.productName),
        transaction.code,
      ].join("|");

      return collection.findIndex((candidate) => {
        const candidateKey = [
          normalizeText(candidate.contactEmail),
          (candidate.contactDocument ?? "").replace(/\D/g, ""),
          normalizeText(candidate.productName),
          candidate.code,
        ].join("|");

        return candidateKey === key;
      }) === index;
    })
    .sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });
});

export const getAllGuruTransactions = cache(async () => {
  const now = new Date();
  const currentWindowEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const windows: Array<{ start: Date; end: Date }> = [];

  for (let cursor = 0; cursor < 6; cursor += 1) {
    const end = new Date(currentWindowEnd);
    end.setUTCDate(end.getUTCDate() - cursor * 180);

    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 179);

    windows.push({ start, end });
  }

  const groupedTransactions = await Promise.all(
    windows.flatMap(({ start, end }) =>
      (["ordered_at", "cancelled_at", "confirmed_at"] as const).map((field) =>
        requestGuruTransactionsByWindow(field, start, end).catch((error) => {
          console.warn("[guru-transactions] falha ao consultar janela de vendas", {
            error,
            field,
            start: toIsoDate(start),
            end: toIsoDate(end),
          });
          return [];
        }),
      ),
    ),
  );

  const deduped = new Map<string, GuruTransactionSnapshot>();
  const persistedTransactions = await getPersistedGuruTransactions().catch((error) => {
    console.warn("[guru-transactions] falha ao consultar snapshots persistidos", error);
    return [];
  });

  for (const transaction of persistedTransactions) {
    deduped.set(transaction.code || transaction.id, transaction);
  }

  for (const group of groupedTransactions) {
    for (const transaction of group) {
      deduped.set(transaction.code || transaction.id, transaction);
    }
  }

  return Array.from(deduped.values())
    .filter((transaction, index, collection) => {
      if (!transaction.contactEmail && !transaction.contactDocument) {
        return true;
      }

      const key = [
        normalizeText(transaction.contactEmail),
        (transaction.contactDocument ?? "").replace(/\D/g, ""),
        normalizeText(transaction.productName),
        transaction.code,
      ].join("|");

      return collection.findIndex((candidate) => {
        const candidateKey = [
          normalizeText(candidate.contactEmail),
          (candidate.contactDocument ?? "").replace(/\D/g, ""),
          normalizeText(candidate.productName),
          candidate.code,
        ].join("|");

        return candidateKey === key;
      }) === index;
    })
    .sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightTime - leftTime;
    });
});

export const getGuruTransactionById = cache(async (transactionId: string) => {
  const normalizedId = transactionId.trim();

  if (!normalizedId) {
    return null;
  }

  const [apiTransaction, persistedSnapshots] = await Promise.all([
    requestGuruTransactionById(normalizedId).catch((error) => {
      console.warn("[guru-transactions] falha ao consultar transaction por id", {
        error,
        transactionId: normalizedId,
      });
      return null;
    }),
    getPersistedGuruTransactions().catch((error) => {
      console.warn("[guru-transactions] falha ao consultar snapshots persistidos", error);
      return [];
    }),
  ]);

  const persistedTransaction =
    persistedSnapshots.find(
      (transaction) =>
        transaction.id === normalizedId || transaction.code === normalizedId,
    ) ?? null;

  return apiTransaction ?? persistedTransaction;
});

export function resolveSalesPeriodRange(period: SalesPeriodPreset, now = new Date()) {
  const end = endOfDay(now);

  switch (period) {
    case "today": {
      const start = startOfDay(now);
      return { start, end };
    }
    case "month": {
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      return { start, end };
    }
    case "year": {
      const start = startOfDay(new Date(now.getFullYear(), 0, 1));
      return { start, end };
    }
    case "custom":
      return normalizeRange({});
    case "week":
    default: {
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
      return { start, end };
    }
  }
}
