import { getCurrentAdminUser } from "@/lib/auth/server";
import { errorResponse, paginatedResponse } from "@/lib/http";
import { DEFAULT_PAGINATION_LIMIT, MAX_PAGINATION_LIMIT } from "@/lib/constants";
import { tradersService } from "@/lib/services/traders-service";

function toPositiveInteger(value: string | null, fallback: number) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric < 1) {
    return fallback;
  }

  return Math.floor(numeric);
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function GET(request: Request) {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser) {
    return errorResponse(401, "UNAUTHORIZED", "Sessao invalida ou expirada.");
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  const q = searchParams.get("q");

  const currentPage = toPositiveInteger(page, 1);
  const currentLimit = Math.min(
    toPositiveInteger(limit, DEFAULT_PAGINATION_LIMIT),
    MAX_PAGINATION_LIMIT,
  );
  const searchQuery = normalizeText(q);
  const result = await tradersService.getOverview();
  const filteredTraders = result.traders.filter((trader) => {
    if (!searchQuery) {
      return true;
    }

    return [trader.name, trader.email, trader.phone, trader.document].some((field) =>
      normalizeText(field).includes(searchQuery),
    );
  });
  const total = filteredTraders.length;
  const totalPages = Math.max(1, Math.ceil(total / currentLimit));
  const normalizedPage = Math.min(currentPage, totalPages);
  const start = (normalizedPage - 1) * currentLimit;
  const pagedTraders = filteredTraders.slice(start, start + currentLimit);

  return paginatedResponse(pagedTraders, {
    total,
    page: normalizedPage,
    limit: currentLimit,
    totalPages,
  });
}
