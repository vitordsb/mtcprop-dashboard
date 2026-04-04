import { z } from "zod";

import { errorResponse, successResponse } from "@/lib/http";

const stringishValueSchema = z
  .union([z.string(), z.number(), z.boolean()])
  .transform((value) => String(value));

const nullableStringishValueSchema = z
  .union([z.string(), z.number(), z.boolean(), z.null()])
  .transform((value) => (value == null ? null : String(value)));

const guruSubscriptionWebhookSchema = z
  .object({
    api_token: z.string().min(20),
    id: stringishValueSchema.optional(),
    status: z.string().optional(),
    payment_method: z.string().optional(),
    currency: z.string().optional(),
    ordered_at: z.string().optional(),
    approved_at: nullableStringishValueSchema.optional(),
    canceled_at: nullableStringishValueSchema.optional(),
    warranty_until: nullableStringishValueSchema.optional(),
    unavailable_until: nullableStringishValueSchema.optional(),
    source: z.string().optional(),
    checkout_source: z.string().optional(),
    value: z.union([z.number(), z.string()]).optional(),
    transaction_fee: z.union([z.number(), z.string()]).optional(),
    shipping_fee: z.union([z.number(), z.string()]).optional(),
    net_value: z.union([z.number(), z.string()]).optional(),
    contact: z
      .object({
        name: z.string().optional(),
        email: z.string().optional(),
        doc: z.string().optional(),
        phone_local_code: z.string().optional(),
        phone_number: z.string().optional(),
      })
      .passthrough()
      .optional(),
    product: z
      .object({
        id: stringishValueSchema.optional(),
        name: z.string().optional(),
        qty: z.union([z.number(), z.string()]).optional(),
        cost: z.union([z.number(), z.string()]).optional(),
      })
      .passthrough()
      .optional(),
    subscription: z
      .object({
        id: stringishValueSchema.optional(),
        name: z.string().optional(),
        status: z.string().optional(),
        charged_times: z.union([z.number(), z.string()]).optional(),
        charged_every_days: z.union([z.number(), z.string()]).optional(),
        started_at: z.string().optional(),
        canceled_at: nullableStringishValueSchema.optional(),
      })
      .passthrough()
      .optional(),
    affiliate: z
      .object({
        id: stringishValueSchema.optional(),
        name: z.string().optional(),
        email: z.string().optional(),
        value: z.union([z.number(), z.string()]).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

function normalizeNestedKey(rawKey: string) {
  return rawKey.replace(/\[(.+?)\]/g, ".$1");
}

function assignNestedValue(
  target: Record<string, unknown>,
  rawKey: string,
  value: unknown,
) {
  const path = normalizeNestedKey(rawKey)
    .split(".")
    .filter(Boolean);

  if (path.length === 0) {
    return;
  }

  let cursor: Record<string, unknown> = target;

  for (const segment of path.slice(0, -1)) {
    const currentValue = cursor[segment];

    if (
      typeof currentValue !== "object" ||
      currentValue === null ||
      Array.isArray(currentValue)
    ) {
      cursor[segment] = {};
    }

    cursor = cursor[segment] as Record<string, unknown>;
  }

  cursor[path[path.length - 1]] = value;
}

function parsePossiblyStructuredBody(rawBody: string) {
  if (!rawBody.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    const searchParams = new URLSearchParams(rawBody);

    if (searchParams.size === 0) {
      return null;
    }

    const normalizedBody: Record<string, unknown> = {};

    for (const [key, value] of searchParams.entries()) {
      assignNestedValue(normalizedBody, key, value);
    }

    return normalizedBody;
  }
}

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
    return errorResponse(
      422,
      "INVALID_PAYLOAD",
      "Payload recebido sem api_token.",
    );
  }

  if (tokenFromPayload !== guruAccountToken) {
    return errorResponse(401, "INVALID_TOKEN", "Token do webhook invalido.");
  }

  const parsedPayload = guruSubscriptionWebhookSchema.safeParse(body);
  const requestId = request.headers.get("x-request-id");

  if (!parsedPayload.success) {
    console.warn("[guru-webhook:subscriptions] payload fora do schema esperado", {
      requestId,
      issues: parsedPayload.error.issues,
      rawBody,
    });

    return successResponse({
      received: true,
      requestId,
      acceptedWithWarnings: true,
    });
  }

  console.info("[guru-webhook:subscriptions] recebido", {
    requestId,
    guruResourceId: parsedPayload.data.id,
    status: parsedPayload.data.status,
    paymentMethod: parsedPayload.data.payment_method,
    orderedAt: parsedPayload.data.ordered_at,
    subscriptionId: parsedPayload.data.subscription?.id,
    subscriptionName: parsedPayload.data.subscription?.name,
    subscriptionStatus: parsedPayload.data.subscription?.status,
    productId: parsedPayload.data.product?.id,
    productName: parsedPayload.data.product?.name,
    customerEmail: parsedPayload.data.contact?.email,
    customerName: parsedPayload.data.contact?.name,
  });

  return successResponse({
    received: true,
    requestId,
    acceptedWithWarnings: false,
  });
}
