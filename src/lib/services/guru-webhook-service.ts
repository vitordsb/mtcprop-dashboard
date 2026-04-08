import { Prisma } from "@prisma/client";
import type { EnrollmentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Tipos extraídos do payload normalizado
// ---------------------------------------------------------------------------

export type GuruSubscriberData = {
  guruContactId: string | null;
  name: string;
  email: string;
  doc: string | null; // CPF/CNPJ sem formatação
  phone: string | null; // DDD + número concatenados
};

export type GuruProductData = {
  guruProductId: string | null;
  name: string;
};

export type GuruSubscriptionEvent = {
  guruSubscriptionId: string;
  guruSubscriptionCode: string | null;
  subscriptionStatus: GuruSubscriptionStatus;
  startedAt: Date | null;
  canceledAt: Date | null;
  subscriber: GuruSubscriberData;
  product: GuruProductData;
};

export type GuruTransactionEvent = {
  guruTransactionId: string;
  guruTransactionCode: string | null;
  guruContactId: string | null;
  contactName: string;
  contactEmail: string | null;
  contactDocument: string | null;
  productName: string;
  productOfferName: string | null;
  status: string | null;
  currency: string | null;
  amount: number | null;
  orderedAt: Date | null;
  confirmedAt: Date | null;
  canceledAt: Date | null;
  guruSubscriptionId: string | null;
  guruSubscriptionCode: string | null;
  rawPayload: unknown;
};

export type GuruSubscriptionStatus =
  | "started"
  | "trial"
  | "active"
  | "pastdue"
  | "inactive"
  | "canceled"
  | "expired";

// ---------------------------------------------------------------------------
// Mapeamento nome do produto Guru → slug interno
// ---------------------------------------------------------------------------

const GURU_PRODUCT_NAME_TO_SLUG: Record<string, string> = {
  "plano start": "plano-start",
  "plano intermediario": "plano-intermediario",
  "plano intermediário": "plano-intermediario",
  "plano avancado": "plano-avancado",
  "plano avançado": "plano-avancado",
  "plano expert": "plano-expert",
  "plano intermediario fast": "plano-intermediario-fast",
  "plano intermediário fast": "plano-intermediario-fast",
  "plano avancado fast": "plano-avancado-fast",
  "plano avançado fast": "plano-avancado-fast",
  "plano intermediario fast pro": "plano-intermediario-fast-pro",
  "plano intermediário fast pro": "plano-intermediario-fast-pro",
  "plano avancado fast pro": "plano-avancado-fast-pro",
  "plano avançado fast pro": "plano-avancado-fast-pro",
  "metodo trader consistente 2": "metodo-trader-consistente-2",
  "método trader consistente 2": "metodo-trader-consistente-2",
  "método trader consistente 2.0": "metodo-trader-consistente-2",
  "metodo trader consistente 2.0": "metodo-trader-consistente-2",
};

function resolveProductSlug(productName: string): string | null {
  const normalized = productName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  // Busca exata normalizada
  if (GURU_PRODUCT_NAME_TO_SLUG[normalized]) {
    return GURU_PRODUCT_NAME_TO_SLUG[normalized];
  }

  // Busca parcial: verifica se alguma chave é substring do nome recebido
  for (const [key, slug] of Object.entries(GURU_PRODUCT_NAME_TO_SLUG)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return slug;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Mapeamento status Guru → EnrollmentStatus interno
// ---------------------------------------------------------------------------

function resolveEnrollmentStatus(
  subscriptionStatus: GuruSubscriptionStatus,
): EnrollmentStatus {
  switch (subscriptionStatus) {
    case "active":
    case "trial":
      return "ACTIVE";
    case "started":
      return "PENDING";
    case "pastdue":
    case "inactive":
      return "PAUSED";
    case "canceled":
    case "expired":
      return "COMPLETED";
  }
}

// ---------------------------------------------------------------------------
// Processamento principal
// ---------------------------------------------------------------------------

export type GuruWebhookProcessResult =
  | { outcome: "processed"; studentId: string; enrollmentId: string }
  | { outcome: "product_not_found"; productName: string }
  | { outcome: "skipped"; reason: string };

export type GuruTransactionProcessResult =
  | { outcome: "processed"; guruTransactionId: string }
  | { outcome: "skipped"; reason: string };

export const guruWebhookService = {
  async processSubscriptionEvent(
    event: GuruSubscriptionEvent,
  ): Promise<GuruWebhookProcessResult> {
    const { subscriber, product, subscriptionStatus, startedAt, canceledAt } =
      event;

    // 1. Resolver o produto
    const productSlug = resolveProductSlug(product.name);

    if (!productSlug) {
      console.warn(
        "[guru-webhook] produto não mapeado — ignorando sem erro",
        { productName: product.name },
      );
      return { outcome: "product_not_found", productName: product.name };
    }

    const dbProduct = await prisma.product.findUnique({
      where: { slug: productSlug },
    });

    if (!dbProduct) {
      console.warn(
        "[guru-webhook] produto mapeado mas não encontrado no banco",
        { slug: productSlug },
      );
      return { outcome: "product_not_found", productName: product.name };
    }

    // 2. Upsert do Student (chave: email)
    const enrollmentStatus = resolveEnrollmentStatus(subscriptionStatus);

    const student = await prisma.student.upsert({
      where: { email: subscriber.email },
      update: {
        name: subscriber.name,
        ...(subscriber.doc ? { nelogicaDocument: subscriber.doc } : {}),
        ...(subscriber.phone ? { phone: subscriber.phone } : {}),
        isActive: enrollmentStatus !== "COMPLETED",
      },
      create: {
        name: subscriber.name,
        email: subscriber.email,
        ...(subscriber.doc ? { nelogicaDocument: subscriber.doc } : {}),
        ...(subscriber.phone ? { phone: subscriber.phone } : {}),
        stage: "ONBOARDING",
        isActive: true,
      },
    });

    // 3. Upsert do Enrollment
    //    Prioridade:
    //    1) vínculo exato por guruSubscriptionId
    //    2) enrollment ainda aberto para o mesmo produto
    const existingEnrollmentByGuruId = event.guruSubscriptionId
      ? await prisma.enrollment.findFirst({
          where: {
            guruSubscriptionId: event.guruSubscriptionId,
          },
          orderBy: { createdAt: "asc" },
        })
      : null;

    const existingEnrollment =
      existingEnrollmentByGuruId ??
      (await prisma.enrollment.findFirst({
        where: {
          studentId: student.id,
          productId: dbProduct.id,
          status: { in: ["ACTIVE", "PENDING", "PAUSED"] },
        },
        orderBy: { createdAt: "asc" },
      }));

    const guruEnrollmentData = {
      guruSubscriptionId: event.guruSubscriptionId,
      guruSubscriptionCode: event.guruSubscriptionCode,
      guruStatus: subscriptionStatus,
      guruProductId: product.guruProductId,
      guruProductName: product.name,
      guruContactId: subscriber.guruContactId,
      guruLastWebhookAt: new Date(),
    };

    let enrollment;

    if (existingEnrollment) {
      enrollment = await prisma.enrollment.update({
        where: { id: existingEnrollment.id },
        data: {
          status: enrollmentStatus,
          startedAt: startedAt ?? existingEnrollment.startedAt,
          endsAt: enrollmentStatus === "COMPLETED" ? (canceledAt ?? new Date()) : null,
          ...guruEnrollmentData,
        },
      });
    } else {
      enrollment = await prisma.enrollment.create({
        data: {
          studentId: student.id,
          productId: dbProduct.id,
          status: enrollmentStatus,
          startedAt: startedAt ?? new Date(),
          ...guruEnrollmentData,
        },
      });
    }

    // 4. Se o novo enrollment está ACTIVE, marcar os outros como COMPLETED
    if (enrollmentStatus === "ACTIVE") {
      await prisma.enrollment.updateMany({
        where: {
          studentId: student.id,
          status: "ACTIVE",
          NOT: { id: enrollment.id },
        },
        data: {
          status: "COMPLETED",
          endsAt: startedAt ?? new Date(),
        },
      });
    }

    console.info("[guru-webhook] evento processado", {
      studentId: student.id,
      enrollmentId: enrollment.id,
      subscriptionStatus,
      enrollmentStatus,
      productSlug,
    });

    return {
      outcome: "processed",
      studentId: student.id,
      enrollmentId: enrollment.id,
    };
  },

  async processTransactionEvent(
    event: GuruTransactionEvent,
  ): Promise<GuruTransactionProcessResult> {
    const amount =
      typeof event.amount === "number" && Number.isFinite(event.amount)
        ? new Prisma.Decimal(event.amount)
        : null;

    await prisma.guruTransactionSnapshot.upsert({
      where: {
        guruTransactionId: event.guruTransactionId,
      },
      update: {
        guruTransactionCode: event.guruTransactionCode,
        guruContactId: event.guruContactId,
        contactName: event.contactName,
        contactEmail: event.contactEmail,
        contactDocument: event.contactDocument,
        productName: event.productName,
        productOfferName: event.productOfferName,
        status: event.status,
        currency: event.currency,
        amount,
        orderedAt: event.orderedAt,
        confirmedAt: event.confirmedAt,
        canceledAt: event.canceledAt,
        guruSubscriptionId: event.guruSubscriptionId,
        guruSubscriptionCode: event.guruSubscriptionCode,
        rawPayload: event.rawPayload as Prisma.InputJsonValue,
      },
      create: {
        guruTransactionId: event.guruTransactionId,
        guruTransactionCode: event.guruTransactionCode,
        guruContactId: event.guruContactId,
        contactName: event.contactName,
        contactEmail: event.contactEmail,
        contactDocument: event.contactDocument,
        productName: event.productName,
        productOfferName: event.productOfferName,
        status: event.status,
        currency: event.currency,
        amount,
        orderedAt: event.orderedAt,
        confirmedAt: event.confirmedAt,
        canceledAt: event.canceledAt,
        guruSubscriptionId: event.guruSubscriptionId,
        guruSubscriptionCode: event.guruSubscriptionCode,
        rawPayload: event.rawPayload as Prisma.InputJsonValue,
      },
    });

    return {
      outcome: "processed",
      guruTransactionId: event.guruTransactionId,
    };
  },
};
