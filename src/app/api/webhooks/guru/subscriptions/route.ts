import { revalidateTag } from "next/cache";
import { z } from "zod";

import { CACHE_TAGS } from "@/lib/constants";
import { errorResponse, successResponse } from "@/lib/http";
import type {
  GuruSubscriptionEvent,
  GuruSubscriptionStatus,
  GuruTransactionEvent,
} from "@/lib/services/guru-webhook-service";
import { guruWebhookService } from "@/lib/services/guru-webhook-service";

// ---------------------------------------------------------------------------
// Helpers de parsing
// ---------------------------------------------------------------------------

const stringishValueSchema = z
  .union([z.string(), z.number(), z.boolean()])
  .transform((value) => String(value));

const nullableStringishValueSchema = z
  .union([z.string(), z.number(), z.boolean(), z.null()])
  .transform((value) => (value == null ? null : String(value)));

// ---------------------------------------------------------------------------
// Schema: Webhook de Assinatura (webhook_type: "subscription")
// Ref: https://docs.digitalmanager.guru/developers/webhook-para-assinaturas
// ---------------------------------------------------------------------------

const guruSubscriberSchema = z.object({
  id: stringishValueSchema.optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  doc: nullableStringishValueSchema.optional(),
  phone_local_code: z.string().optional(),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  address_number: z.string().optional(),
  address_comp: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zip_code: z.string().optional(),
}).passthrough();

const guruSubscriptionDatesSchema = z.object({
  started_at: z.string().optional(),
  next_cycle_at: z.string().optional(),
  canceled_at: nullableStringishValueSchema.optional(),
  confirmed_at: nullableStringishValueSchema.optional(),
  created_at: nullableStringishValueSchema.optional(),
  ordered_at: nullableStringishValueSchema.optional(),
  cycle_start_date: z.string().optional(),
  cycle_end_date: z.string().optional(),
}).passthrough();

const guruSubscriptionWebhookSchema = z.object({
  api_token: z.string().min(20),
  webhook_type: z.string().optional(), // "subscription" | "transaction"

  // --- Campos do webhook de assinatura ---
  id: stringishValueSchema.optional(),
  internal_id: stringishValueSchema.optional(),
  subscription_code: stringishValueSchema.optional(),
  last_status: z.string().optional(), // active, canceled, pastdue, etc.
  charged_every_days: z.union([z.number(), z.string()]).optional(),
  charged_times: z.union([z.number(), z.string()]).optional(),
  payment_method: z.string().optional(),
  cancel_at_cycle_end: z.boolean().optional(),
  cancel_reason: z.string().nullable().optional(),
  trial_days: z.union([z.number(), z.string()]).optional(),
  trial_started_at: nullableStringishValueSchema.optional(),
  trial_finished_at: nullableStringishValueSchema.optional(),
  dates: guruSubscriptionDatesSchema.optional(),
  subscriber: guruSubscriberSchema.optional(),

  // --- Campos do webhook de transação (formato legado) ---
  status: z.string().optional(),
  currency: z.string().optional(),
  ordered_at: z.string().optional(),
  approved_at: nullableStringishValueSchema.optional(),
  canceled_at: nullableStringishValueSchema.optional(),
  warranty_until: nullableStringishValueSchema.optional(),
  value: z.union([z.number(), z.string()]).optional(),
  transaction_fee: z.union([z.number(), z.string()]).optional(),
  net_value: z.union([z.number(), z.string()]).optional(),
  payment: z.object({
    marketplace_id: stringishValueSchema.optional(),
    total: z.union([z.number(), z.string()]).optional(),
    net: z.union([z.number(), z.string()]).optional(),
    gross: z.union([z.number(), z.string()]).optional(),
    currency: z.string().optional(),
  }).passthrough().optional(),
  items: z.array(z.object({
    id: stringishValueSchema.optional(),
    name: z.string().optional(),
    total_value: z.union([z.number(), z.string()]).optional(),
    unit_value: z.union([z.number(), z.string()]).optional(),
    qty: z.union([z.number(), z.string()]).optional(),
    offer: z.object({
      id: stringishValueSchema.optional(),
      name: z.string().optional(),
    }).passthrough().optional(),
  }).passthrough()).optional(),

  // Contato (formato transação legado)
  contact: z.object({
    id: stringishValueSchema.optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    doc: z.string().optional(),
    phone_local_code: z.string().optional(),
    phone_number: z.string().optional(),
  }).passthrough().optional(),
  buyer: z.object({
    id: stringishValueSchema.optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    doc: z.string().optional(),
    phone_local_code: z.string().optional(),
    phone_number: z.string().optional(),
  }).passthrough().optional(),

  // Produto (presente em ambos os formatos)
  product: z.object({
    id: stringishValueSchema.optional(),
    name: z.string().optional(),
    qty: z.union([z.number(), z.string()]).optional(),
    cost: z.union([z.number(), z.string()]).optional(),
    offer: z.object({
      id: stringishValueSchema.optional(),
      plan: z.object({
        interval: z.union([z.number(), z.string()]).optional(),
        interval_type: z.string().optional(),
      }).passthrough().optional(),
    }).passthrough().optional(),
  }).passthrough().optional(),

  // Assinatura aninhada (formato transação)
  subscription: z.object({
    id: stringishValueSchema.optional(),
    subscription_code: stringishValueSchema.optional(),
    name: z.string().optional(),
    last_status: z.string().optional(),
    status: z.string().optional(),
    charged_times: z.union([z.number(), z.string()]).optional(),
    charged_every_days: z.union([z.number(), z.string()]).optional(),
    started_at: z.string().optional(),
    canceled_at: nullableStringishValueSchema.optional(),
    can_cancel: z.boolean().optional(),
  }).passthrough().optional(),

  affiliate: z.object({
    id: stringishValueSchema.optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    value: z.union([z.number(), z.string()]).optional(),
  }).passthrough().optional(),
}).passthrough();

type GuruWebhookPayload = z.infer<typeof guruSubscriptionWebhookSchema>;

// ---------------------------------------------------------------------------
// Normalização: extrai dados unificados independente do formato recebido
// ---------------------------------------------------------------------------

const SUBSCRIPTION_STATUSES = new Set<GuruSubscriptionStatus>([
  "started", "trial", "active", "pastdue", "inactive", "canceled", "expired",
]);

function isSubscriptionStatus(value: string | undefined): value is GuruSubscriptionStatus {
  return !!value && SUBSCRIPTION_STATUSES.has(value as GuruSubscriptionStatus);
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function buildPhone(localCode?: string, number?: string): string | null {
  if (!localCode && !number) return null;
  return `${localCode ?? ""}${number ?? ""}`.trim() || null;
}

function parseGuruDateLike(value: unknown): Date | null {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value === "number") {
    const timestamp = value > 9999999999 ? value : value * 1000;
    const parsed = new Date(timestamp);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const numeric = Number(value.trim());
    const timestamp = numeric > 9999999999 ? numeric : numeric * 1000;
    const parsed = new Date(timestamp);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return parseDate(typeof value === "string" ? value : null);
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  return null;
}

function resolveTransactionAmount(payload: GuruWebhookPayload) {
  return (
    toNumber(payload.payment?.total) ??
    toNumber(payload.payment?.net) ??
    toNumber(payload.payment?.gross) ??
    payload.items?.reduce<number | null>((total, item) => {
      const itemTotal = toNumber(item.total_value) ?? toNumber(item.unit_value);
      if (itemTotal == null) {
        return total;
      }
      return (total ?? 0) + itemTotal;
    }, null) ??
    toNumber(payload.net_value) ??
    toNumber(payload.value)
  );
}

function normalizeToTransactionEvent(
  payload: GuruWebhookPayload,
): GuruTransactionEvent | null {
  const contact = payload.contact ?? payload.subscriber ?? payload.buyer;
  const transactionId = payload.id ?? payload.internal_id ?? null;
  const transactionCode = payload.payment?.marketplace_id ?? payload.internal_id ?? payload.id ?? null;
  const fallbackProductLabel =
    payload.items?.[0]?.offer?.name ??
    payload.items?.[0]?.name ??
    payload.product?.offer?.id ??
    payload.subscription?.name ??
    null;

  if (!transactionId || !contact || !(payload.product?.name || fallbackProductLabel)) {
    return null;
  }

  const productOfferName =
    payload.items?.[0]?.offer?.name ??
    payload.product?.offer?.id ??
    payload.product?.name ??
    fallbackProductLabel ??
    null;

  const productName =
    payload.items && payload.items.length > 0
      ? payload.items
          .map((item) => {
            const qty = toNumber(item.qty) ?? 1;
            const name =
              item.offer?.name ??
              item.name ??
              payload.product?.offer?.id ??
              payload.product?.name ??
              payload.subscription?.name ??
              "Produto nao informado";
            return `${qty} x ${name}`;
          })
          .join(" + ")
      : payload.product?.name ?? fallbackProductLabel ?? "Produto nao informado";

  return {
    guruTransactionId: transactionId,
    guruTransactionCode: transactionCode,
    guruContactId: contact.id ?? null,
    contactName: contact.name ?? "Contato nao informado",
    contactEmail: contact.email ?? null,
    contactDocument: contact.doc ?? null,
    productName,
    productOfferName,
    status: payload.status ?? payload.subscription?.status ?? payload.subscription?.last_status ?? null,
    currency: payload.payment?.currency ?? payload.currency ?? null,
    amount: resolveTransactionAmount(payload),
    orderedAt: parseGuruDateLike(payload.dates?.ordered_at ?? payload.ordered_at),
    confirmedAt: parseGuruDateLike(payload.dates?.confirmed_at ?? payload.approved_at),
    canceledAt: parseGuruDateLike(payload.dates?.canceled_at ?? payload.canceled_at),
    guruSubscriptionId: payload.subscription?.id ?? null,
    guruSubscriptionCode: payload.subscription?.subscription_code ?? payload.subscription_code ?? null,
    rawPayload: payload,
  };
}

/**
 * Normaliza o payload para o formato interno GuruSubscriptionEvent.
 * Suporta tanto o webhook de assinatura (subscriber + last_status)
 * quanto o webhook de transação legado (contact + subscription.last_status).
 *
 * Retorna null quando o evento não deve gerar processamento
 * (ex.: transação sem subscription vinculada, ou status não mapeável).
 */
function normalizeToSubscriptionEvent(
  payload: GuruWebhookPayload,
): GuruSubscriptionEvent | null {
  const webhookType = payload.webhook_type ?? "unknown";

  // --- Formato: webhook de assinatura ---
  if (webhookType === "subscription" && payload.subscriber) {
    const sub = payload.subscriber;
    const rawStatus = payload.last_status;

    if (!isSubscriptionStatus(rawStatus)) {
      return null;
    }

    return {
      guruSubscriptionId: payload.id ?? payload.subscription_code ?? "unknown",
      guruSubscriptionCode: payload.subscription_code ?? null,
      subscriptionStatus: rawStatus,
      startedAt: parseDate(payload.dates?.started_at),
      canceledAt: parseDate(payload.dates?.canceled_at ?? null),
      subscriber: {
        guruContactId: sub.id ?? null,
        name: sub.name ?? "Trader",
        email: sub.email ?? "",
        doc: sub.doc ?? null,
        phone: buildPhone(sub.phone_local_code, sub.phone_number),
      },
      product: {
        guruProductId: payload.product?.id ?? null,
        name: payload.product?.name ?? "",
      },
    };
  }

  // --- Formato: webhook de transação com subscription aninhada ---
  if (webhookType === "transaction" || payload.contact) {
    const contact = payload.contact;
    const subscription = payload.subscription;

    // Só processa se tiver subscription vinculada e status mapeável
    const rawStatus =
      subscription?.last_status ?? subscription?.status ?? payload.status;

    if (!isSubscriptionStatus(rawStatus)) {
      return null;
    }

    // Sem subscriber/contact não há como criar o trader
    if (!contact?.email && !payload.subscriber?.email) {
      return null;
    }

    const email = contact?.email ?? payload.subscriber?.email ?? "";
    const name = contact?.name ?? payload.subscriber?.name ?? "Trader";
    const doc = contact?.doc ?? payload.subscriber?.doc ?? null;
    const phoneLocalCode = contact?.phone_local_code ?? payload.subscriber?.phone_local_code;
    const phoneNumber = contact?.phone_number ?? payload.subscriber?.phone_number;

    return {
      guruSubscriptionId: subscription?.id ?? payload.id ?? "unknown",
      guruSubscriptionCode:
        subscription?.subscription_code ?? payload.subscription_code ?? null,
      subscriptionStatus: rawStatus,
      startedAt: parseDate(subscription?.started_at ?? payload.approved_at ?? null),
      canceledAt: parseDate(subscription?.canceled_at ?? payload.canceled_at ?? null),
      subscriber: {
        guruContactId: null,
        name,
        email,
        doc: doc ?? null,
        phone: buildPhone(phoneLocalCode, phoneNumber),
      },
      product: {
        guruProductId: payload.product?.id ?? null,
        name: payload.product?.name ?? subscription?.name ?? "",
      },
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Body parser: suporta JSON e application/x-www-form-urlencoded
// ---------------------------------------------------------------------------

function normalizeNestedKey(rawKey: string) {
  return rawKey.replace(/\[(.+?)\]/g, ".$1");
}

function assignNestedValue(
  target: Record<string, unknown>,
  rawKey: string,
  value: unknown,
) {
  const path = normalizeNestedKey(rawKey).split(".").filter(Boolean);

  if (path.length === 0) return;

  let cursor: Record<string, unknown> = target;

  for (const segment of path.slice(0, -1)) {
    const current = cursor[segment];
    if (typeof current !== "object" || current === null || Array.isArray(current)) {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as Record<string, unknown>;
  }

  cursor[path[path.length - 1]] = value;
}

function parsePossiblyStructuredBody(rawBody: string): unknown | null {
  if (!rawBody.trim()) return null;

  try {
    return JSON.parse(rawBody);
  } catch {
    const searchParams = new URLSearchParams(rawBody);
    if (searchParams.size === 0) return null;

    const result: Record<string, unknown> = {};
    for (const [key, value] of searchParams.entries()) {
      assignNestedValue(result, key, value);
    }
    return result;
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const guruAccountToken = process.env.GURU_ACCOUNT_TOKEN;

  if (!guruAccountToken) {
    return errorResponse(
      500,
      "GURU_WEBHOOK_NOT_CONFIGURED",
      "GURU_ACCOUNT_TOKEN nao configurado no ambiente.",
    );
  }

  const rawBody = await request.text();
  const body = parsePossiblyStructuredBody(rawBody);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorResponse(400, "INVALID_BODY", "Payload do webhook invalido.");
  }

  const tokenFromPayload =
    "api_token" in body && typeof body.api_token === "string"
      ? body.api_token
      : null;

  if (!tokenFromPayload) {
    return errorResponse(422, "INVALID_PAYLOAD", "Payload recebido sem api_token.");
  }

  if (tokenFromPayload !== guruAccountToken) {
    return errorResponse(401, "INVALID_TOKEN", "Token do webhook invalido.");
  }

  const parsedPayload = guruSubscriptionWebhookSchema.safeParse(body);
  const requestId = request.headers.get("x-request-id");

  if (!parsedPayload.success) {
    console.warn("[guru-webhook] payload fora do schema esperado", {
      requestId,
      issues: parsedPayload.error.issues,
    });
    return successResponse({ received: true, requestId, acceptedWithWarnings: true });
  }

  const transactionEvent = normalizeToTransactionEvent(parsedPayload.data);
  const subscriptionEvent = normalizeToSubscriptionEvent(parsedPayload.data);

  if (!transactionEvent && !subscriptionEvent) {
    console.info("[guru-webhook] evento ignorado (sem subscription ou status nao mapeavel)", {
      requestId,
      webhookType: parsedPayload.data.webhook_type,
      status: parsedPayload.data.status ?? parsedPayload.data.last_status,
    });
    return successResponse({ received: true, requestId, skipped: true });
  }

  const [transactionResult, subscriptionResult] = await Promise.all([
    transactionEvent
      ? guruWebhookService.processTransactionEvent(transactionEvent)
      : Promise.resolve(null),
    subscriptionEvent
      ? guruWebhookService.processSubscriptionEvent(subscriptionEvent)
      : Promise.resolve(null),
  ]);

  if (transactionResult?.outcome === "processed") {
    revalidateTag(CACHE_TAGS.SALES_OVERVIEW, {});
  }

  if (subscriptionResult?.outcome === "processed") {
    revalidateTag(CACHE_TAGS.DASHBOARD_OVERVIEW, {});
  }

  return successResponse({
    received: true,
    requestId,
    transaction: transactionResult,
    subscription: subscriptionResult,
  });
}
