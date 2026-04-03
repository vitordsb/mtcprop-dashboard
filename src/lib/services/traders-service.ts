import type {
  Prisma,
  StudentStage as DbStudentStage,
  TraderSourceOrigin,
} from "@prisma/client";

import { getCompanySnapshot } from "@/lib/company-snapshot";
import { prisma } from "@/lib/prisma";
import type { StudentStage } from "@/types/dashboard";
import type { TraderListItem, TraderWorkbookOrigin, TradersOverview } from "@/types/traders";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 10;

const stageLabelMap: Record<DbStudentStage, StudentStage> = {
  ONBOARDING: "Onboarding",
  TRAINING: "Treinamento",
  EVALUATION: "Avaliacao",
  SIMULATOR: "Simulador",
  LIVE_DESK: "Mesa real",
};

const originLabelMap: Record<TraderSourceOrigin, TraderWorkbookOrigin> = {
  CHALLENGE: "Challenge",
  FAST: "Fast",
  LIVE_DESK: "Conta real",
};

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR").format(value);
}

function toPositiveInteger(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);

    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function inferOrigin(params: {
  workbookOrigin?: TraderSourceOrigin | null;
  stage: DbStudentStage;
  planSlug?: string | null;
}): TraderWorkbookOrigin {
  if (params.workbookOrigin) {
    return originLabelMap[params.workbookOrigin];
  }

  if (params.stage === "LIVE_DESK") {
    return "Conta real";
  }

  if (params.planSlug?.includes("fast")) {
    return "Fast";
  }

  return "Challenge";
}

function parseSourceSheets(value: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export const tradersService = {
  async getOverview(params?: {
    page?: number | string | null;
    limit?: number | string | null;
  }): Promise<TradersOverview> {
    const requestedLimit = toPositiveInteger(params?.limit) ?? DEFAULT_LIMIT;
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const requestedPage = toPositiveInteger(params?.page) ?? 1;

    const total = await prisma.student.count({
      where: { isActive: true },
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(requestedPage, totalPages);
    const skip = (page - 1) * limit;

    const students = await prisma.student.findMany({
      where: { isActive: true },
      orderBy: [
        { stage: "desc" },
        { updatedAt: "desc" },
        { name: "asc" },
      ],
      skip,
      take: limit,
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
          take: 1,
          include: {
            product: true,
          },
        },
        accessGrants: {
          select: {
            status: true,
          },
        },
      },
    });

    const traders = students.map((student) => {
      const activeEnrollment = student.enrollments[0];
      const activeAccess = student.accessGrants.filter(
        (accessGrant) => accessGrant.status === "ACTIVE",
      ).length;
      const pendingAccess = student.accessGrants.filter(
        (accessGrant) => accessGrant.status === "PENDING",
      ).length;

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        plan: activeEnrollment?.product.name ?? "Sem plano ativo",
        stage: stageLabelMap[student.stage],
        origin: inferOrigin({
          workbookOrigin: student.workbookOrigin,
          stage: student.stage,
          planSlug: activeEnrollment?.product.slug,
        }),
        startedAt: formatDate(activeEnrollment?.startedAt),
        accessActive: activeAccess,
        accessPending: pendingAccess,
        historyCount: student.workbookHistoryCount,
        nextMonthlyDue: formatDate(student.workbookNextMonthlyDueAt),
        restartUsed: student.workbookRestartUsed,
        sourceSheets: parseSourceSheets(student.workbookSourceSheets),
      } satisfies TraderListItem;
    });

    return {
      company: getCompanySnapshot(),
      traders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    };
  },
};
