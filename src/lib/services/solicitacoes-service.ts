import { getCompanySnapshot } from "@/lib/company-snapshot";
import { CACHE_TAGS, DEFAULT_PAGINATION_LIMIT, MAX_PAGINATION_LIMIT } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { SolicitacaoStatus, SolicitacaoType } from "@prisma/client";
import { unstable_cache } from "next/cache";

export type SolicitacaoTypeKey =
  | "APROVACAO"
  | "LIBERACAO_PLATAFORMA"
  | "MIGRACAO_MESA_REAL"
  | "RESET_GRATUITO"
  | "REPASSE";

export type SolicitacaoStatusKey = "PENDENTE" | "APROVADA" | "REJEITADA" | "CONCLUIDA";

export const SOLICITACAO_TYPE_LABEL: Record<SolicitacaoTypeKey, string> = {
  APROVACAO: "Aprovação",
  LIBERACAO_PLATAFORMA: "Liberação de Plataforma",
  MIGRACAO_MESA_REAL: "Migração para Mesa Real",
  RESET_GRATUITO: "Reset Gratuito",
  REPASSE: "Repasse",
};

export type SolicitacaoListItem = {
  id: string;
  type: SolicitacaoTypeKey;
  typeLabel: string;
  status: SolicitacaoStatusKey;
  studentId: string;
  studentName: string;
  studentEmail: string;
  document: string | null;
  masterAccount: string | null;
  message: string | null;
  adminNotes: string | null;
  createdAt: string;
  createdAtFormatted: string;
  decidedAt: string | null;
  decidedAtFormatted: string | null;
};

export type SolicitacoesPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  q?: string;
  status?: string;
  type?: string;
};

export type SolicitacoesOverview = {
  company: ReturnType<typeof getCompanySnapshot>;
  items: SolicitacaoListItem[];
  pagination: SolicitacoesPagination;
  /** Contadores por status pra mostrar nas abas */
  counts: Record<SolicitacaoStatusKey, number>;
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function toPositiveInteger(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return null;
}

const getCachedSolicitacoes = unstable_cache(
  async (
    pageParam?: number | string | null,
    limitParam?: number | string | null,
    statusParam?: string | null,
    typeParam?: string | null,
    queryParam?: string | null,
  ): Promise<SolicitacoesOverview> => {
    const requestedLimit = toPositiveInteger(limitParam) ?? DEFAULT_PAGINATION_LIMIT;
    const limit = Math.min(requestedLimit, MAX_PAGINATION_LIMIT);
    const requestedPage = toPositiveInteger(pageParam) ?? 1;
    const status = statusParam?.toUpperCase() as SolicitacaoStatus | null | undefined;
    const type = typeParam?.toUpperCase() as SolicitacaoType | null | undefined;
    const searchQuery = queryParam?.trim();

    const where: Record<string, unknown> = {};
    if (status && ["PENDENTE", "APROVADA", "REJEITADA", "CONCLUIDA"].includes(status)) {
      where.status = status;
    }
    if (
      type &&
      ["APROVACAO", "LIBERACAO_PLATAFORMA", "MIGRACAO_MESA_REAL", "RESET_GRATUITO", "REPASSE"].includes(type)
    ) {
      where.type = type;
    }
    if (searchQuery) {
      where.OR = [
        { student: { name: { contains: searchQuery, mode: "insensitive" } } },
        { student: { email: { contains: searchQuery, mode: "insensitive" } } },
        { document: { contains: searchQuery, mode: "insensitive" } },
        { masterAccount: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    const [total, rows, countsRaw] = await Promise.all([
      prisma.solicitacao.count({ where }),
      prisma.solicitacao.findMany({
        where,
        include: { student: { select: { id: true, name: true, email: true } } },
        orderBy: [{ createdAt: "desc" }],
        skip: (requestedPage - 1) * limit,
        take: limit,
      }),
      prisma.solicitacao.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(requestedPage, totalPages);

    const counts: Record<SolicitacaoStatusKey, number> = {
      PENDENTE: 0,
      APROVADA: 0,
      REJEITADA: 0,
      CONCLUIDA: 0,
    };
    for (const c of countsRaw) {
      counts[c.status as SolicitacaoStatusKey] = c._count._all;
    }

    const items: SolicitacaoListItem[] = rows.map((r) => ({
      id: r.id,
      type: r.type as SolicitacaoTypeKey,
      typeLabel: SOLICITACAO_TYPE_LABEL[r.type as SolicitacaoTypeKey],
      status: r.status as SolicitacaoStatusKey,
      studentId: r.studentId,
      studentName: r.student.name,
      studentEmail: r.student.email,
      document: r.document,
      masterAccount: r.masterAccount,
      message: r.message,
      adminNotes: r.adminNotes,
      createdAt: r.createdAt.toISOString(),
      createdAtFormatted: formatDate(r.createdAt) ?? "—",
      decidedAt: r.decidedAt ? r.decidedAt.toISOString() : null,
      decidedAtFormatted: r.decidedAt ? formatDate(r.decidedAt) : null,
    }));

    return {
      company: getCompanySnapshot(),
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
        q: queryParam ?? undefined,
        status: statusParam ?? undefined,
        type: typeParam ?? undefined,
      },
      counts,
    };
  },
  [CACHE_TAGS.SOLICITACOES_OVERVIEW],
  { revalidate: 30, tags: [CACHE_TAGS.SOLICITACOES_OVERVIEW] },
);

export const solicitacoesService = {
  async getOverview(params?: {
    page?: number | string | null;
    limit?: number | string | null;
    status?: string | null;
    type?: string | null;
    q?: string | null;
  }) {
    return getCachedSolicitacoes(params?.page, params?.limit, params?.status, params?.type, params?.q);
  },
};
