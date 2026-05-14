import { CheckCircle, CircleDashed, Clock, Sparkles, XCircle } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/app-shell";
import { Pagination } from "@/components/dashboard/pagination";
import { SearchBar } from "@/components/dashboard/search-bar";
import { SolicitacoesActionsForm } from "@/components/dashboard/solicitacoes-actions-form";
import type {
  SolicitacaoStatusKey,
  SolicitacoesOverview,
} from "@/lib/services/solicitacoes-service";

type Props = { data: SolicitacoesOverview };

const STATUS_TABS: { key: SolicitacaoStatusKey; label: string; icon: typeof Clock }[] = [
  { key: "PENDENTE", label: "Pendentes", icon: Clock },
  { key: "APROVADA", label: "Aprovadas", icon: CheckCircle },
  { key: "REJEITADA", label: "Rejeitadas", icon: XCircle },
  { key: "CONCLUIDA", label: "Concluídas", icon: Sparkles },
];

function statusBadgeClass(status: SolicitacaoStatusKey) {
  switch (status) {
    case "PENDENTE":
      return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";
    case "APROVADA":
      return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";
    case "REJEITADA":
      return "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300";
    case "CONCLUIDA":
      return "border-[var(--brand)] bg-[var(--app-accent-soft-bg)] text-[var(--brand)]";
  }
}

function formatDocument(doc: string | null) {
  if (!doc) return "—";
  const digits = doc.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }
  return doc;
}

export function SolicitacoesOverviewView({ data }: Props) {
  const currentStatus = (data.pagination.status?.toUpperCase() as SolicitacaoStatusKey) ?? "PENDENTE";

  function tabHref(status: SolicitacaoStatusKey) {
    const params = new URLSearchParams();
    params.set("status", status);
    if (data.pagination.q) params.set("q", data.pagination.q);
    if (data.pagination.type) params.set("type", data.pagination.type);
    return `/dashboard/solicitacoes?${params.toString()}`;
  }

  return (
    <DashboardShell company={data.company} pageTitle="Solicitações">
      <section className="theme-card overflow-hidden rounded-[24px]">
        {/* TABS */}
        <div className="flex flex-wrap items-center gap-1 border-b border-[var(--app-border-soft)] px-4 py-3">
          {STATUS_TABS.map(({ key, label, icon: Icon }) => {
            const active = currentStatus === key;
            const count = data.counts[key];
            return (
              <Link
                key={key}
                href={tabHref(key)}
                prefetch
                className={`inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-[var(--app-accent-soft-bg)] text-[var(--brand)]"
                    : "text-[var(--app-text-subtle)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                <span
                  className={`min-w-[20px] rounded-full px-2 text-center text-[11px] ${
                    active
                      ? "bg-[var(--brand)] text-white"
                      : "bg-[var(--app-surface-soft)] text-[var(--app-text-subtle)]"
                  }`}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* SEARCH */}
        <div className="border-b border-[var(--app-border-soft)] px-6 py-4">
          <div className="flex w-full flex-col gap-3 lg:max-w-xl lg:flex-row lg:items-center">
            <SearchBar placeholder="Buscar por trader, CPF ou conta..." />
            <Link
              href="/dashboard/solicitacoes"
              prefetch
              className="inline-flex items-center justify-center rounded-[12px] border border-[var(--app-border-strong)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-hover)]"
            >
              Limpar
            </Link>
          </div>
        </div>

        {/* LIST */}
        <div className="divide-y divide-[var(--app-border-soft)]">
          {data.items.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <CircleDashed className="mx-auto h-8 w-8 text-[var(--app-text-subtle)]" />
              <p className="theme-title mt-3 text-base font-semibold">
                Nenhuma solicitação {currentStatus.toLowerCase()}.
              </p>
              <p className="theme-text-subtle mt-1 text-sm">
                As solicitações aparecem aqui assim que os traders criam.
              </p>
            </div>
          ) : (
            data.items.map((s) => (
              <div key={s.id} className="px-6 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full border border-[var(--app-border-strong)] bg-[var(--app-surface-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-text)]">
                        {s.typeLabel}
                      </span>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusBadgeClass(s.status)}`}
                      >
                        {s.status}
                      </span>
                      {s.masterAccount && (
                        <span className="text-[11px] text-[var(--app-text-subtle)]">
                          Master <span className="font-mono">{s.masterAccount}</span>
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-[var(--app-text)]">{s.studentName}</p>
                    <p className="text-[12px] text-[var(--app-text-subtle)]">
                      {s.studentEmail} · {formatDocument(s.document)}
                    </p>
                    {s.message && (
                      <p className="mt-2 max-w-2xl rounded-[10px] border-l-2 border-[var(--app-border-strong)] bg-[var(--app-surface-soft)] px-3 py-2 text-[13px] text-[var(--app-text)]">
                        “{s.message}”
                      </p>
                    )}
                    {s.adminNotes && (
                      <p className="mt-1 text-[12px] text-[var(--app-text-subtle)]">
                        <strong className="text-[var(--app-text)]">Admin:</strong> {s.adminNotes}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="text-[11px] text-[var(--app-text-subtle)]">
                      Criada em {s.createdAtFormatted}
                      {s.decidedAtFormatted && ` · Decidida em ${s.decidedAtFormatted}`}
                    </p>
                    <SolicitacoesActionsForm id={s.id} status={s.status} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* PAGINATION */}
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          total={data.pagination.total}
          itemsOnPage={data.items.length}
          basePath="/dashboard/solicitacoes"
          extraParams={{ q: data.pagination.q, status: data.pagination.status, type: data.pagination.type }}
        />
      </section>
    </DashboardShell>
  );
}
