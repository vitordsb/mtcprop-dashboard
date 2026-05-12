"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  CircleDashed,
  CreditCard,
  Download,
  Filter,
  Landmark,
  LoaderCircle,
  QrCode,
  ReceiptText,
  Search,
  X,
  XCircle,
  WalletCards,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PaginationClient } from "@/components/dashboard/pagination-client";
import {
  getSemanticStatusTextClass,
  getSemanticStatusTone,
} from "@/components/dashboard/status-badge";
import type { SaleRecord, SalesOverview, SalesPeriodPreset } from "@/types/sales";

type SalesOverviewClientProps = {
  data: SalesOverview;
};

type SalesSortOption =
  | "newest"
  | "oldest"
  | "name"
  | "highest-value"
  | "lowest-value"
  | "custom-value";

type FilterDraft = {
  contact: string;
  product: string;
  status: string;
  period: SalesPeriodPreset;
  dateFrom: string;
  dateTo: string;
  sortBy: SalesSortOption;
  minAmount: string;
  maxAmount: string;
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatCreatedAt(value: string | null) {
  if (!value) return "Sem data";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function matchesSearch(sale: SaleRecord, query: string) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return true;
  }

  return [
    sale.code,
    sale.contactName,
    sale.contactEmail,
    sale.productName,
    sale.amountLabel,
  ].some((field) => normalizeText(field).includes(normalizedQuery));
}

function matchesFilters(sale: SaleRecord, filters: FilterDraft) {
  const contactFilter = normalizeText(filters.contact);
  const productFilter = normalizeText(filters.product);
  const statusFilter = normalizeText(filters.status);

  if (
    contactFilter &&
    ![sale.contactName, sale.contactEmail].some((field) =>
      normalizeText(field).includes(contactFilter),
    )
  ) {
    return false;
  }

  if (productFilter && !normalizeText(sale.productName).includes(productFilter)) {
    return false;
  }

  if (statusFilter && normalizeText(sale.statusLabel) !== statusFilter) {
    return false;
  }

  if (filters.dateFrom || filters.dateTo) {
    if (!sale.createdAt) {
      return false;
    }

    const createdAt = new Date(sale.createdAt);
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

  if (filters.sortBy === "custom-value") {
    const amount = sale.amount ?? 0;
    const minAmount = filters.minAmount ? Number(filters.minAmount) : null;
    const maxAmount = filters.maxAmount ? Number(filters.maxAmount) : null;

    if (minAmount !== null && !Number.isNaN(minAmount) && amount < minAmount) {
      return false;
    }

    if (maxAmount !== null && !Number.isNaN(maxAmount) && amount > maxAmount) {
      return false;
    }
  }

  return true;
}

function sortSales(sales: SaleRecord[], sortBy: SalesSortOption) {
  const sorted = [...sales];

  switch (sortBy) {
    case "oldest":
      return sorted.sort((left, right) => {
        const leftDate = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightDate = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return leftDate - rightDate;
      });
    case "name":
      return sorted.sort((left, right) =>
        left.contactName.localeCompare(right.contactName, "pt-BR", {
          sensitivity: "base",
        }),
      );
    case "highest-value":
      return sorted.sort((left, right) => (right.amount ?? 0) - (left.amount ?? 0));
    case "lowest-value":
      return sorted.sort((left, right) => (left.amount ?? 0) - (right.amount ?? 0));
    case "custom-value":
    case "newest":
    default:
      return sorted.sort((left, right) => {
        const leftDate = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightDate = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return rightDate - leftDate;
      });
  }
}

function getStatusIcon(status: string | null) {
  const tone = getSemanticStatusTone(status);
  const className = getSemanticStatusTextClass(status);

  if (tone === "success") {
    return <CheckCircle2 className={`h-4 w-4 ${className}`} />;
  }

  if (tone === "danger") {
    return <XCircle className={`h-4 w-4 ${className}`} />;
  }

  if (tone === "warning") {
    return <CircleDashed className={`h-4 w-4 ${className}`} />;
  }

  return <CircleDashed className={`h-4 w-4 ${className}`} />;
}

function getPaymentMethodIcon(method: string | null) {
  switch (method) {
    case "credit_card":
      return <CreditCard className="h-4 w-4" />;
    case "pix":
      return <QrCode className="h-4 w-4" />;
    case "billet":
      return <ReceiptText className="h-4 w-4" />;
    case "bank_transfer":
      return <Landmark className="h-4 w-4" />;
    default:
      return <WalletCards className="h-4 w-4" />;
  }
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

function SalesFiltersModal({
  isOpen,
  initialValues,
  availableStatuses,
  onApply,
  onClose,
  onClear,
}: {
  isOpen: boolean;
  initialValues: FilterDraft;
  availableStatuses: string[];
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
              Filtros de vendas
            </h2>
            <p className="theme-text-subtle mt-1 text-sm">
              Refine a lista por contato, produto e intervalo de datas.
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
            <div className="md:col-span-2">
              <label className="theme-text block text-sm font-medium">
                Período
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { value: "today", label: "Hoje" },
                  { value: "week", label: "Últimos 7 dias" },
                  { value: "month", label: "Este mês" },
                  { value: "six-months", label: "Últimos 6 meses" },
                  { value: "year", label: "Este ano" },
                  { value: "custom", label: "Personalizado" },
                ].map((option) => {
                  const isActive = draft.period === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          period: option.value as SalesPeriodPreset,
                        }))
                      }
                      className={`inline-flex rounded-[999px] px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "theme-button-primary"
                          : "theme-pill-soft theme-text hover:bg-[var(--app-hover)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="theme-text block text-sm font-medium">
                Contato
              </label>
              <input
                className="theme-input mt-2 w-full rounded-[12px] border px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                value={draft.contact}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, contact: event.target.value }))
                }
                placeholder="Nome ou email do contato"
              />
            </div>

            <div>
              <label className="theme-text block text-sm font-medium">
                Produto
              </label>
              <input
                className="theme-input mt-2 w-full rounded-[12px] border px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                value={draft.product}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, product: event.target.value }))
                }
                placeholder="Nome do produto"
              />
            </div>

            <div>
              <label className="theme-text block text-sm font-medium">
                Status
              </label>
              <select
                className="theme-input mt-2 w-full rounded-[12px] border px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                value={draft.status}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, status: event.target.value }))
                }
              >
                <option value="">Todos</option>
                {availableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="theme-text block text-sm font-medium">
                Ordenar por
              </label>
              <select
                className="theme-input mt-2 w-full rounded-[12px] border px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                value={draft.sortBy}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    sortBy: event.target.value as SalesSortOption,
                  }))
                }
              >
                <option value="newest">Mais recente</option>
                <option value="oldest">Mais antigo</option>
                <option value="name">Nome</option>
                <option value="highest-value">Maior valor</option>
                <option value="lowest-value">Menor valor</option>
                <option value="custom-value">Valor personalizado</option>
              </select>
            </div>

            <div>
              <label className="theme-text block text-sm font-medium">
                Data inicial
              </label>
              <input
                type="date"
                disabled={draft.period !== "custom"}
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
                disabled={draft.period !== "custom"}
                className="theme-input mt-2 w-full rounded-[12px] border px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                value={draft.dateTo}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, dateTo: event.target.value }))
                }
              />
            </div>

            {draft.sortBy === "custom-value" ? (
              <>
                <div>
                  <label className="theme-text block text-sm font-medium">
                    Valor mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="theme-input mt-2 w-full rounded-[12px] border px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                    value={draft.minAmount}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, minAmount: event.target.value }))
                    }
                    placeholder="Ex.: 297"
                  />
                </div>

                <div>
                  <label className="theme-text block text-sm font-medium">
                    Valor máximo
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="theme-input mt-2 w-full rounded-[12px] border px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                    value={draft.maxAmount}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, maxAmount: event.target.value }))
                    }
                    placeholder="Ex.: 1500"
                  />
                </div>
              </>
            ) : null}
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

export function SalesOverviewClient({ data }: SalesOverviewClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterDraft>({
    contact: "",
    product: "",
    status: "",
    period: data.period,
    dateFrom: data.dateFrom,
    dateTo: data.dateTo,
    sortBy: "newest",
    minAmount: "",
    maxAmount: "",
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(searchTerm);
  const isSearching = searchTerm !== deferredSearch || isPending;

  const filteredSales = useMemo(() => {
    const filtered = data.sales.filter(
      (sale) => matchesSearch(sale, deferredSearch) && matchesFilters(sale, filters),
    );

    return sortSales(filtered, filters.sortBy);
  }, [data.sales, deferredSearch, filters]);

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const visibleSales = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [safeCurrentPage, filteredSales]);

  const activeFilterCount = [
    filters.contact,
    filters.product,
    filters.status,
    filters.period !== "month" ? filters.period : "",
    filters.period === "custom" ? filters.dateFrom : "",
    filters.period === "custom" ? filters.dateTo : "",
    filters.sortBy !== "newest" ? filters.sortBy : "",
    filters.sortBy === "custom-value" ? filters.minAmount : "",
    filters.sortBy === "custom-value" ? filters.maxAmount : "",
  ].filter(Boolean).length;

  function syncPeriodOnUrl(nextFilters: FilterDraft) {
    const currentPeriod = searchParams.get("period") ?? data.period;
    const currentDateFrom = searchParams.get("dateFrom") ?? data.dateFrom;
    const currentDateTo = searchParams.get("dateTo") ?? data.dateTo;
    const nextDateFrom = nextFilters.period === "custom" ? nextFilters.dateFrom : "";
    const nextDateTo = nextFilters.period === "custom" ? nextFilters.dateTo : "";

    if (
      currentPeriod === nextFilters.period &&
      currentDateFrom === (nextDateFrom || data.dateFrom) &&
      currentDateTo === (nextDateTo || data.dateTo)
    ) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    params.set("period", nextFilters.period);

    if (nextFilters.period === "custom") {
      if (nextFilters.dateFrom) {
        params.set("dateFrom", nextFilters.dateFrom);
      } else {
        params.delete("dateFrom");
      }

      if (nextFilters.dateTo) {
        params.set("dateTo", nextFilters.dateTo);
      } else {
        params.delete("dateTo");
      }
    } else {
      params.delete("dateFrom");
      params.delete("dateTo");
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function applyFilters(nextFilters: FilterDraft) {
    setFilters(nextFilters);
    setCurrentPage(1);
    setIsFilterModalOpen(false);
    syncPeriodOnUrl(nextFilters);
  }

  function clearFilters() {
    const clearedFilters: FilterDraft = {
      contact: "",
      product: "",
      status: "",
      period: "month",
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
      sortBy: "newest",
      minAmount: "",
      maxAmount: "",
    };

    setFilters(clearedFilters);
    setCurrentPage(1);
    setIsFilterModalOpen(false);
    startTransition(() => {
      router.replace(`${pathname}?period=month`, { scroll: false });
    });
  }

  function exportSales() {
    const rows = [
      ["Codigo", "Contato", "Email", "Produto", "Criada em", "Valor", "Status"],
      ...filteredSales.map((sale) => [
        sale.code,
        sale.contactName,
        sale.contactEmail || "Sem email",
        sale.productName,
        formatCreatedAt(sale.createdAt),
        sale.amountLabel,
        sale.statusLabel || "Nao informado",
      ]),
    ];

    downloadCsv("mtcprop-vendas.csv", rows);
  }

  return (
    <section className="theme-card overflow-hidden rounded-[24px]">
      <div className="border-b border-[var(--app-border-soft)] px-6 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="theme-text-subtle pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Pesquisar por código, contato, email ou produto..."
              className="theme-input w-full rounded-[12px] border py-2.5 pr-4 pl-11 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
            />
            {isSearching && (
              <LoaderCircle className="theme-accent-text pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              onClick={exportSales}
              className="theme-accent-soft inline-flex items-center gap-2 rounded-[12px] px-4 py-2 text-sm font-medium transition hover:brightness-[1.03]"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>

            <button
              type="button"
              onClick={() =>
                startTransition(() => {
                  router.refresh();
                })
              }
              aria-label="Recarregar"
              className="theme-card-soft theme-text inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[var(--app-border-strong)] transition hover:bg-[var(--app-hover)]"
            >
              <LoaderCircle className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {!data.guruConfigured ? (
          <div className="theme-warning-box mt-3 rounded-[16px] px-4 py-3 text-sm">
            `GURU_USER_TOKEN` não configurado. A listagem de vendas da Guru só aparece quando esse token estiver disponível.
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1120px] w-full">
          <thead className="theme-table-head">
            <tr className="theme-text-subtle text-left text-[11px] font-semibold uppercase tracking-[0.18em]">
              <th className="px-6 py-4">Código</th>
              <th className="px-4 py-4">Contato</th>
              <th className="px-4 py-4">Produto</th>
              <th className="px-4 py-4">Criada em</th>
              <th className="px-4 py-4">Valor</th>
              <th className="px-6 py-4 text-center">Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {visibleSales.length > 0 ? (
              visibleSales.map((sale) => (
                <tr
                  key={sale.id}
                  className="theme-table-row cursor-pointer border-t border-[var(--app-border-soft)] text-sm transition hover:bg-[var(--app-hover)]"
                  onClick={() => router.push(`/dashboard/vendas/${encodeURIComponent(sale.id)}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/dashboard/vendas/${encodeURIComponent(sale.id)}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span
                        title={sale.statusLabel || "Status não informado"}
                        aria-label={sale.statusLabel || "Status não informado"}
                      >
                        {getStatusIcon(sale.statusCode || sale.statusLabel)}
                      </span>
                      <span className="theme-title font-medium">{sale.code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div>
                      <p className="theme-text">{sale.contactName}</p>
                      <p className="theme-text-subtle mt-1 text-xs">
                        {sale.contactEmail || "Sem email"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <p className="theme-text">{sale.productName}</p>
                  </td>
                  <td className="px-4 py-5">
                    <p className="theme-text">{formatCreatedAt(sale.createdAt)}</p>
                  </td>
                  <td className="px-4 py-5">
                    <p className="theme-title font-medium">{sale.amountLabel}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span
                      title={sale.paymentMethodLabel || "Forma de pagamento não informada"}
                      aria-label={sale.paymentMethodLabel || "Forma de pagamento não informada"}
                      className="theme-pill-soft theme-text inline-flex h-10 w-10 items-center justify-center rounded-[12px]"
                    >
                      {getPaymentMethodIcon(sale.paymentMethod)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-sm text-[var(--app-text-subtle)]"
                >
                  Nenhuma venda encontrada para os critérios atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationClient
        page={safeCurrentPage}
        totalPages={totalPages}
        total={filteredSales.length}
        itemsOnPage={visibleSales.length}
        onPageChange={setCurrentPage}
      />

      <SalesFiltersModal
        isOpen={isFilterModalOpen}
        initialValues={filters}
        availableStatuses={data.availableStatuses}
        onApply={applyFilters}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={clearFilters}
      />
    </section>
  );
}
