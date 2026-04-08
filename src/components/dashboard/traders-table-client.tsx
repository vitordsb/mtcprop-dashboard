"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";

import { CreateTraderContactModal } from "@/components/dashboard/create-trader-contact-modal";
import type { TraderListItem, TradersOverview } from "@/types/traders";

type TradersTableClientProps = {
  data: TradersOverview;
};

type FilterDraft = {
  name: string;
  region: string;
  dateFrom: string;
  dateTo: string;
};

const EMPTY_FILTERS: FilterDraft = {
  name: "",
  region: "",
  dateFrom: "",
  dateTo: "",
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesTextFilter(trader: TraderListItem, query: string) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return true;
  }

  return [
    trader.name,
    trader.email,
    trader.phone,
    trader.document,
  ].some((field) => normalizeText(field).includes(normalizedQuery));
}

function matchesAdvancedFilters(trader: TraderListItem, filters: FilterDraft) {
  const nameFilter = normalizeText(filters.name);
  const regionFilter = normalizeText(filters.region);

  if (nameFilter && !normalizeText(trader.name).includes(nameFilter)) {
    return false;
  }

  if (
    regionFilter &&
    ![
      trader.regionLabel,
      trader.city,
      trader.state,
      trader.country,
    ].some((field) => normalizeText(field).includes(regionFilter))
  ) {
    return false;
  }

  if (filters.dateFrom || filters.dateTo) {
    if (!trader.createdAt) {
      return false;
    }

    const createdAt = new Date(trader.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      return false;
    }

    if (filters.dateFrom) {
      const startDate = new Date(`${filters.dateFrom}T00:00:00`);
      if (createdAt < startDate) {
        return false;
      }
    }

    if (filters.dateTo) {
      const endDate = new Date(`${filters.dateTo}T23:59:59`);
      if (createdAt > endDate) {
        return false;
      }
    }
  }

  return true;
}

function formatCreatedAt(value: string | null) {
  if (!value) return "Sem data";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(date);
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildTraderHref(traderId: string) {
  return `/dashboard/traders/${encodeURIComponent(traderId)}`;
}

function FiltersModal({
  isOpen,
  initialValues,
  onApply,
  onClose,
  onClear,
}: {
  isOpen: boolean;
  initialValues: FilterDraft;
  onApply: (filters: FilterDraft) => void;
  onClose: () => void;
  onClear: () => void;
}) {
  const [draft, setDraft] = useState<FilterDraft>(initialValues);

  useEffect(() => {
    setDraft(initialValues);
  }, [initialValues]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(7,17,8,0.52)] px-4 py-8 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="theme-card relative z-10 w-full max-w-2xl overflow-hidden rounded-[24px]">
        <div className="theme-shell-surface flex items-center justify-between border-b border-[var(--app-border-soft)] px-6 py-5">
          <div>
            <h2 className="theme-title text-2xl font-semibold tracking-[-0.04em]">
              Filtros de Traders
            </h2>
            <p className="theme-text-subtle mt-1 text-sm">
              Refine a lista por nome, região e data.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="theme-icon-button flex h-10 w-10 items-center justify-center rounded-[12px] transition"
            aria-label="Fechar filtros"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="theme-text block text-sm font-medium">
                Nome
              </label>
              <input
                className="theme-input mt-2 w-full rounded-[12px] border px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Filtrar por nome"
              />
            </div>

            <div>
              <label className="theme-text block text-sm font-medium">
                Região
              </label>
              <input
                className="theme-input mt-2 w-full rounded-[12px] border px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                value={draft.region}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, region: event.target.value }))
                }
                placeholder="Cidade, estado ou país"
              />
            </div>

            <div>
              <label className="theme-text block text-sm font-medium">
                Data inicial
              </label>
              <input
                type="date"
                className="theme-input mt-2 w-full rounded-[12px] border px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                value={draft.dateFrom}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, dateFrom: event.target.value }))
                }
              />
            </div>

            <div>
              <label className="theme-text block text-sm font-medium">
                Data final
              </label>
              <input
                type="date"
                className="theme-input mt-2 w-full rounded-[12px] border px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                value={draft.dateTo}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, dateTo: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="theme-warning-box mt-5 rounded-[14px] px-4 py-3 text-sm">
            O filtro de data depende da data de criação retornada pela Guru. Se algum contato não trouxer esse campo, ele não entra no recorte por data.
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[var(--app-border-soft)] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClear}
              className="theme-text inline-flex items-center justify-center rounded-[12px] border border-[var(--app-border-strong)] bg-[var(--app-surface)] px-4 py-3 text-sm font-medium transition hover:bg-[var(--app-hover)]"
            >
              Limpar
            </button>

            <button
              type="button"
              onClick={() => onApply(draft)}
              className="theme-button-primary inline-flex items-center justify-center rounded-[12px] px-5 py-3 text-sm font-semibold transition"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TradersTableClient({ data }: TradersTableClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterDraft>(EMPTY_FILTERS);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const deferredSearch = useDeferredValue(searchTerm);
  const isSearching = searchTerm !== deferredSearch;

  const filteredTraders = useMemo(() => {
    return data.traders.filter(
      (trader) =>
        matchesTextFilter(trader, deferredSearch) &&
        matchesAdvancedFilters(trader, filters),
    );
  }, [data.traders, deferredSearch, filters]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTraders.length / data.defaultPageSize),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const visibleTraders = useMemo(() => {
    const start = (safeCurrentPage - 1) * data.defaultPageSize;
    return filteredTraders.slice(start, start + data.defaultPageSize);
  }, [safeCurrentPage, data.defaultPageSize, filteredTraders]);

  const activeFilterCount = [
    filters.name,
    filters.region,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  function applyFilters(nextFilters: FilterDraft) {
    setFilters(nextFilters);
    setIsFilterModalOpen(false);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setIsFilterModalOpen(false);
  }

  function exportFilteredContacts() {
    const rows = [
      ["Nome", "Email", "Telefone", "Documento", "Região", "Data"],
      ...filteredTraders.map((trader) => [
        trader.name,
        trader.email,
        trader.phone,
        trader.document,
        trader.regionLabel || "Sem região",
        formatCreatedAt(trader.createdAt),
      ]),
    ];

    downloadCsv("traders-guru-filtrados.csv", rows);
  }

  return (
    <section className="theme-card overflow-hidden rounded-[24px]">
      <div className="border-b border-[var(--app-border-soft)] px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-md">
              <Search className="theme-text-subtle pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Pesquisar por nome, email, telefone ou documento..."
                className="theme-input w-full rounded-[12px] border py-3 pr-4 pl-11 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                className="theme-text inline-flex items-center gap-2 rounded-[12px] border border-[var(--app-border-strong)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--app-hover)]"
              >
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 ? `Filtros (${activeFilterCount})` : "Filtros"}
              </button>

              <button
                type="button"
                onClick={exportFilteredContacts}
                className="theme-accent-soft inline-flex items-center gap-2 rounded-[12px] px-4 py-2 text-sm font-medium transition hover:brightness-[1.03]"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>

              <CreateTraderContactModal />
            </div>
          </div>

          <div className="flex flex-col items-start gap-1 text-sm xl:items-end">
            <div className="theme-text-subtle">
              Exibindo {visibleTraders.length} de {filteredTraders.length} registros
            </div>
            {isSearching ? (
              <div className="theme-accent-text inline-flex items-center gap-2 text-sm font-medium">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Pesquisando...
              </div>
            ) : null}
          </div>
        </div>

        {!data.guruConfigured ? (
          <div className="theme-warning-box mt-4 rounded-[16px] px-4 py-3 text-sm">
            `GURU_USER_TOKEN` não configurado. A listagem de contatos da Guru só aparece
            quando esse token estiver disponível.
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[820px] w-full">
          <thead className="theme-table-head">
            <tr className="theme-text-subtle text-left text-[11px] font-semibold uppercase tracking-[0.18em]">
              <th className="px-6 py-4">Nome</th>
              <th className="px-4 py-4">Email</th>
              <th className="px-4 py-4">Telefone</th>
              <th className="px-4 py-4">Documento</th>
            </tr>
          </thead>
          <tbody>
            {visibleTraders.length > 0 ? (
              visibleTraders.map((trader) => {
                const href = buildTraderHref(trader.id);

                return (
                  <tr
                    key={trader.id}
                    className="theme-table-row border-t border-[var(--app-border-soft)] text-sm transition"
                  >
                    <td className="px-6 py-5">
                      <Link
                        href={href}
                        className="theme-title block font-semibold hover:text-[var(--brand)] focus:outline-none focus:text-[var(--brand)]"
                        aria-label={`Abrir perfil de ${trader.name}`}
                      >
                        {trader.name}
                      </Link>
                    </td>
                    <td className="px-4 py-5">
                      <Link
                        href={href}
                        className="theme-text block hover:text-[var(--brand)] focus:outline-none focus:text-[var(--brand)]"
                        aria-label={`Abrir perfil de ${trader.name}`}
                      >
                        {trader.email}
                      </Link>
                    </td>
                    <td className="px-4 py-5">
                      <Link
                        href={href}
                        className="theme-text block hover:text-[var(--brand)] focus:outline-none focus:text-[var(--brand)]"
                        aria-label={`Abrir perfil de ${trader.name}`}
                      >
                        {trader.phone}
                      </Link>
                    </td>
                    <td className="px-4 py-5">
                      <Link
                        href={href}
                        className="theme-text block hover:text-[var(--brand)] focus:outline-none focus:text-[var(--brand)]"
                        aria-label={`Abrir perfil de ${trader.name}`}
                      >
                        {trader.document}
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-sm text-[var(--app-text-subtle)]"
                >
                  Nenhum contato encontrado para os critérios atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-[var(--app-border-soft)] px-6 py-4">
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={safeCurrentPage === 1}
            className={`inline-flex items-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-medium transition ${
              safeCurrentPage > 1
                ? "theme-card-soft theme-text border-[var(--app-border-strong)] hover:bg-[var(--app-hover)]"
                : "cursor-not-allowed border-[var(--app-border-soft)] bg-[var(--app-surface-soft)] text-[var(--app-text-subtle)]"
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          <span className="theme-text-muted min-w-[140px] text-center text-sm font-medium">
            Página {safeCurrentPage} de {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={safeCurrentPage >= totalPages}
            className={`inline-flex items-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-medium transition ${
              safeCurrentPage < totalPages
                ? "theme-card-soft theme-text border-[var(--app-border-strong)] hover:bg-[var(--app-hover)]"
                : "cursor-not-allowed border-[var(--app-border-soft)] bg-[var(--app-surface-soft)] text-[var(--app-text-subtle)]"
            }`}
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <FiltersModal
        isOpen={isFilterModalOpen}
        initialValues={filters}
        onApply={applyFilters}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={clearFilters}
      />
    </section>
  );
}
