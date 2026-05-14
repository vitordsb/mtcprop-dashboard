import { AlertCircle, Calendar, CheckCircle } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/app-shell";
import { Pagination } from "@/components/dashboard/pagination";
import { SearchBar } from "@/components/dashboard/search-bar";
import type { MensalidadesOverview } from "@/lib/services/mensalidades-service";

type Props = { data: MensalidadesOverview };

function formatDocument(doc: string) {
  const digits = (doc || "").replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }
  return doc;
}

export function MensalidadesOverviewView({ data }: Props) {
  return (
    <DashboardShell company={data.company} pageTitle="Mensalidades">
      <section className="theme-card overflow-hidden rounded-[24px]">
        {/* SEARCH + FILTERS */}
        <div className="border-b border-[var(--app-border-soft)] px-6 py-4">
          <div className="flex w-full flex-col gap-3 lg:max-w-xl lg:flex-row lg:items-center">
            <SearchBar placeholder="Buscar por nome, CPF, conta ou plataforma..." />
            <Link
              href="/dashboard/mensalidades"
              prefetch
              className="inline-flex items-center justify-center rounded-[12px] border border-[var(--app-border-strong)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-hover)]"
            >
              Limpar
            </Link>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full">
            <thead className="theme-table-head">
              <tr className="theme-text-subtle text-left text-[11px] font-semibold uppercase tracking-[0.18em]">
                <th className="px-6 py-4">Subconta</th>
                <th className="px-4 py-4">Trader</th>
                <th className="px-4 py-4">Plataforma</th>
                <th className="px-4 py-4">Início</th>
                <th className="px-4 py-4">Próxima Mensalidade</th>
                <th className="px-4 py-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {data.items.length === 0 ? (
                <tr className="border-t border-[var(--app-border-soft)]">
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <div className="space-y-2">
                      <p className="theme-title text-base font-semibold">
                        Nenhuma mensalidade encontrada.
                      </p>
                      <p className="theme-text-subtle text-sm">
                        Filtramos apenas traders das masters <strong>MTC Prop Remunerado</strong>
                        {" "}e <strong>MTC Prop Mesa Real</strong>.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((m) => (
                  <tr
                    key={m.id}
                    className="theme-table-row border-t border-[var(--app-border-soft)] text-sm transition"
                  >
                    {/* Subconta */}
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="font-mono font-semibold text-[var(--app-text)]">
                          {m.subAccount}
                        </p>
                        <p className="text-[11px] text-[var(--app-text-subtle)]">
                          Master <span className="font-mono">{m.masterAccount}</span>
                        </p>
                        <p className="text-[11px] font-medium text-[var(--app-text)]">
                          {m.masterAccountHolder}
                        </p>
                      </div>
                    </td>

                    {/* Trader */}
                    <td className="px-4 py-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-[var(--app-text)]">{m.studentName}</p>
                        {m.document && (
                          <p className="font-mono text-[11px] text-[var(--app-text-subtle)]">
                            {formatDocument(m.document)}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Plataforma */}
                    <td className="px-4 py-4">
                      <p className="font-medium text-[var(--app-text)]">{m.plataforma}</p>
                      {m.guruPlanName && (
                        <p className="text-[11px] text-[var(--app-text-subtle)]">{m.guruPlanName}</p>
                      )}
                    </td>

                    {/* Início */}
                    <td className="px-4 py-4 text-[13px] text-[var(--app-text-subtle)]">
                      {m.inicioFormatted}
                    </td>

                    {/* Próxima */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-[var(--app-text-subtle)]" />
                        <div className="space-y-0.5">
                          <p className="font-medium text-[var(--app-text)]">
                            {m.proximaMensalidadeFormatted}
                          </p>
                          <p className="text-[10px] text-[var(--app-text-subtle)]">
                            {m.diasParaProxima > 0
                              ? `em ${m.diasParaProxima} dia(s)`
                              : m.diasParaProxima === 0
                                ? "hoje"
                                : `${Math.abs(m.diasParaProxima)} dia(s) em atraso`}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {m.status === "EM DIA" ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            <span className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                              Em dia
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-rose-500" />
                            <span className="inline-flex rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                              Atrasada
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          total={data.pagination.total}
          itemsOnPage={data.items.length}
          basePath="/dashboard/mensalidades"
          extraParams={{ q: data.pagination.q }}
        />
      </section>
    </DashboardShell>
  );
}
