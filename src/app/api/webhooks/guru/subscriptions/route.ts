import { z } from "zod";

import { errorResponse, successResponse } from "@/lib/http";

const guruSubscriptionWebhookSchema = z.object({
  api_token: z.string().min(40).max(40),
  id: z.union([z.string(), z.number()]).transform(String),
  status: z.string(),
  contact: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
    })
    .optional(),
  product: z
    .object({
      id: z.union([z.string(), z.number()]).transform(String).optional(),
      name: z.string().optional(),
    })
    .optional(),
  subscription: z
    .object({
      id: z.union([z.string(), z.number()]).transform(String),
      name: z.string().optional(),
      status: z.string().optional(),
      charged_times: z.number().optional(),
      charged_every_days: z.number().optional(),
      started_at: z.string().optional(),
      canceled_at: z.string().optional().nullable(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const guruAccountToken = process.env.GURU_ACCOUNT_TOKEN;

  if (!guruAccountToken) {
    return errorResponse(
      500,
      "GURU_WEBHOOK_NOT_CONFIGURED",
      "GURU_ACCOUNT_TOKEN nao configurado no ambiente.",
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_JSON", "Payload JSON invalido.");
  }

  const parsedPayload = guruSubscriptionWebhookSchema.safeParse(body);

  if (!parsedPayload.success) {
    return errorResponse(422, "INVALID_PAYLOAD", "Payload do webhook invalido.");
  }

  if (parsedPayload.data.api_token !== guruAccountToken) {
    return errorResponse(401, "INVALID_TOKEN", "Token do webhook invalido.");
  }

  const requestId = request.headers.get("x-request-id");

  console.info("[guru-webhook:subscriptions] recebido", {
    requestId,
    guruResourceId: parsedPayload.data.id,
    status: parsedPayload.data.status,
    subscriptionId: parsedPayload.data.subscription?.id,
    subscriptionStatus: parsedPayload.data.subscription?.status,
    productId: parsedPayload.data.product?.id,
    productName: parsedPayload.data.product?.name,
    customerEmail: parsedPayload.data.contact?.email,
  });

  return successResponse({
    received: true,
    requestId,
  });
}
