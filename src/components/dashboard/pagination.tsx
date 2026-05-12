import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  itemsOnPage: number;
  /** Base path da página (ex: "/dashboard/planos-ativos"). */
  basePath: string;
  /** Query params extras a preservar (ex: { q: "trader" }). */
  extraParams?: Record<string, string | undefined>;
}

/**
 * Gera os números de página visíveis com truncamento inteligente.
 * Ex: page=7, totalPages=20 → [1, "...", 5, 6, 7, 8, 9, "...", 20]
 */
function buildPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];
  const left = Math.max(2, current - 2);
  const right = Math.min(total - 1, current + 2);

  if (left > 2) pages.push("...");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push("...");

  pages.push(total);
  return pages;
}

function buildHref(
  basePath: string,
  page: number,
  extraParams?: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  params.set("page", page.toString());
  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      if (v) params.set(k, v);
    }
  }
  return `${basePath}?${params.toString()}`;
}

export function Pagination({
  page,
  totalPages,
  total,
  itemsOnPage,
  basePath,
  extraParams,
}: PaginationProps) {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const pageNumbers = buildPageNumbers(page, totalPages);

  const navBtn =
    "inline-flex h-9 w-9 items-center justify-center rounded-[10px] border text-sm font-medium transition";
  const navBtnEnabled =
    "theme-card-soft theme-text border-[var(--app-border-strong)] hover:bg-[var(--app-hover)]";
  const navBtnDisabled =
    "cursor-not-allowed border-[var(--app-border-soft)] bg-[var(--app-surface-soft)] text-[var(--app-text-subtle)]";

  const startItem = total === 0 ? 0 : (page - 1) * Math.max(itemsOnPage, 1) + 1;
  const endItem = total === 0 ? 0 : startItem + itemsOnPage - 1;

  const link = (p: number) => buildHref(basePath, p, extraParams);

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--app-border-soft)] px-6 py-4 md:flex-row md:items-center md:justify-between">
      <p className="theme-text-subtle text-sm">
        {total === 0 ? (
          <>Nenhum resultado</>
        ) : (
          <>
            Mostrando <span className="font-semibold text-[var(--app-text)]">{startItem}</span>–
            <span className="font-semibold text-[var(--app-text)]">{endItem}</span> de{" "}
            <span className="font-semibold text-[var(--app-text)]">{total}</span>
          </>
        )}
      </p>

      <nav className="flex items-center gap-1" aria-label="Paginação">
        {hasPrev ? (
          <Link href={link(1)} prefetch className={`${navBtn} ${navBtnEnabled}`} aria-label="Primeira página">
            <ChevronsLeft className="h-4 w-4" />
          </Link>
        ) : (
          <span className={`${navBtn} ${navBtnDisabled}`} aria-label="Primeira página" aria-disabled="true">
            <ChevronsLeft className="h-4 w-4" />
          </span>
        )}

        {hasPrev ? (
          <Link href={link(page - 1)} prefetch className={`${navBtn} ${navBtnEnabled}`} aria-label="Página anterior">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <span className={`${navBtn} ${navBtnDisabled}`} aria-label="Página anterior" aria-disabled="true">
            <ChevronLeft className="h-4 w-4" />
          </span>
        )}

        <div className="mx-1 flex items-center gap-1">
          {pageNumbers.map((p, idx) =>
            p === "..." ? (
              <span
                key={`ellipsis-${idx}`}
                className={`${navBtn} cursor-default border-transparent text-[var(--app-text-subtle)]`}
                aria-hidden
              >
                …
              </span>
            ) : (
              <Link
                key={p}
                href={link(p)}
                prefetch={p !== page}
                aria-current={p === page ? "page" : undefined}
                className={`${navBtn} ${
                  p === page
                    ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                    : navBtnEnabled
                }`}
              >
                {p}
              </Link>
            ),
          )}
        </div>

        {hasNext ? (
          <Link href={link(page + 1)} prefetch className={`${navBtn} ${navBtnEnabled}`} aria-label="Próxima página">
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className={`${navBtn} ${navBtnDisabled}`} aria-label="Próxima página" aria-disabled="true">
            <ChevronRight className="h-4 w-4" />
          </span>
        )}

        {hasNext ? (
          <Link href={link(totalPages)} prefetch className={`${navBtn} ${navBtnEnabled}`} aria-label="Última página">
            <ChevronsRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className={`${navBtn} ${navBtnDisabled}`} aria-label="Última página" aria-disabled="true">
            <ChevronsRight className="h-4 w-4" />
          </span>
        )}
      </nav>
    </div>
  );
}
