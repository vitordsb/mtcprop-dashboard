import { cache } from "react";
import { z } from "zod";
import { fetchGuruWithReadAuth, getGuruReadToken } from "@/lib/services/guru-auth";

const guruSubscriptionSchema = z
  .object({
    id: z.string(),
    subscription_code: z.string().nullable().optional(),
    last_status: z.string().nullable().optional(),
    started_at: z.number().nullable().optional(),
    cancelled_at: z.number().nullable().optional(),
    contact: z
      .object({
        id: z.string().nullable().optional(),
        email: z.string().nullable().optional(),
        name: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
    product: z
      .object({
        id: z.string().nullable().optional(),
        name: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
  })
  .passthrough();

const guruSubscriptionListSchema = z
  .object({
    data: z.array(guruSubscriptionSchema).default([]),
    has_more_pages: z.coerce.number().optional(),
    next_cursor: z.string().nullable().optional(),
  })
  .passthrough();

export type GuruLiveSubscriptionSnapshot = {
  id: string;
  subscriptionCode: string | null;
  status: string | null;
  startedAt: Date | null;
  productName: string | null;
  contactName: string | null;
};

const STATUS_PRIORITY: Record<string, number> = {
  active: 7,
  trial: 6,
  pastdue: 5,
  started: 4,
  inactive: 3,
  canceled: 2,
  expired: 1,
};

function toGuruDate(unixTimestamp?: number | null) {
  if (!unixTimestamp || !Number.isFinite(unixTimestamp)) {
    return null;
  }

  return new Date(unixTimestamp * 1000);
}

function compareSubscriptions(
  left: z.infer<typeof guruSubscriptionSchema>,
  right: z.infer<typeof guruSubscriptionSchema>,
) {
  const leftPriority = STATUS_PRIORITY[left.last_status ?? ""] ?? 0;
  const rightPriority = STATUS_PRIORITY[right.last_status ?? ""] ?? 0;

  if (leftPriority !== rightPriority) {
    return rightPriority - leftPriority;
  }

  const leftStartedAt = left.started_at ?? 0;
  const rightStartedAt = right.started_at ?? 0;

  return rightStartedAt - leftStartedAt;
}

async function requestGuruSubscriptionsByEmail(email: string) {
  const guruUserToken = getGuruReadToken();

  if (!guruUserToken) {
    return [];
  }

  const results: Array<z.infer<typeof guruSubscriptionSchema>> = [];
  const baseUrl = process.env.GURU_API_BASE_URL || "https://digitalmanager.guru/api/v2";
  let cursor: string | null | undefined = undefined;
  let safetyCounter = 0;

  do {
    const searchParams = new URLSearchParams();
    searchParams.set("contact_email", email);

    if (cursor) {
      searchParams.set("cursor", cursor);
    }

    const response = await fetchGuruWithReadAuth(`${baseUrl}/subscriptions?${searchParams.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(
        `[Guru] HTTP ${response.status} ao consultar subscriptions de ${email}.`,
      );
    }

    const payload = guruSubscriptionListSchema.parse(await response.json());
    results.push(...payload.data);

    cursor = payload.has_more_pages ? payload.next_cursor : null;
    safetyCounter += 1;
  } while (cursor && safetyCounter < 5);

  return results;
}

export const getGuruSubscriptionSnapshotByEmail = cache(async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const subscriptions = await requestGuruSubscriptionsByEmail(normalizedEmail);

  if (subscriptions.length === 0) {
    return null;
  }

  const [bestSubscription] = subscriptions.sort(compareSubscriptions);

  return {
    id: bestSubscription.id,
    subscriptionCode: bestSubscription.subscription_code ?? null,
    status: bestSubscription.last_status ?? null,
    startedAt: toGuruDate(bestSubscription.started_at),
    productName: bestSubscription.product?.name ?? null,
    contactName: bestSubscription.contact?.name ?? null,
  } satisfies GuruLiveSubscriptionSnapshot;
});
