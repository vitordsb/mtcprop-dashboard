"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationClientProps {
  page: number;
  totalPages: number;
  total: number;
  itemsOnPage: number;
  onPageChange: (page: number) => void;
}

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

export function PaginationClient({
  page,
  totalPages,
  total,
  itemsOnPage,
  onPageChange,
}: PaginationClientProps) {
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
        <button type="button" disabled={!hasPrev} onClick={() => onPageChange(1)}
          className={`${navBtn} ${hasPrev ? navBtnEnabled : navBtnDisabled}`} aria-label="Primeira página">
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button type="button" disabled={!hasPrev} onClick={() => onPageChange(page - 1)}
          className={`${navBtn} ${hasPrev ? navBtnEnabled : navBtnDisabled}`} aria-label="Página anterior">
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="mx-1 flex items-center gap-1">
          {pageNumbers.map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`} className={`${navBtn} cursor-default border-transparent text-[var(--app-text-subtle)]`} aria-hidden>
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={`${navBtn} ${
                  p === page ? "border-[var(--brand)] bg-[var(--brand)] text-white" : navBtnEnabled
                }`}
              >
                {p}
              </button>
            ),
          )}
        </div>

        <button type="button" disabled={!hasNext} onClick={() => onPageChange(page + 1)}
          className={`${navBtn} ${hasNext ? navBtnEnabled : navBtnDisabled}`} aria-label="Próxima página">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button type="button" disabled={!hasNext} onClick={() => onPageChange(totalPages)}
          className={`${navBtn} ${hasNext ? navBtnEnabled : navBtnDisabled}`} aria-label="Última página">
          <ChevronsRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
