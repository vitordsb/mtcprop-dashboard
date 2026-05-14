import {
  TriangleAlert,
  CheckCircle,
  CircleDashed,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/app-shell";
import { getSemanticStatusBadgeClass } from "@/components/dashboard/status-badge";
import { SearchBar } from "@/components/dashboard/search-bar";
import { Pagination } from "@/components/dashboard/pagination";
import { ActivePlansActionsMenu } from "@/components/dashboard/active-plans-actions-menu";
import { ApprovalCell } from "@/components/dashboard/approval-cell";
import {
  actionCancelarLicenca,
  actionProvisionarLicenca,
} from "@/app/actions/nelogica-actions";
import type { ActivePlansOverview } from "@/lib/services/plans-service";

type ActivePlansOverviewProps = {
  data: ActivePlansOverview;
};

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

export function ActivePlansOverviewView({ data }: ActivePlansOverviewProps) {
  return (
    <DashboardShell company={data.company} pageTitle="Planos Ativos">
      <section className="theme-card overflow-hidden rounded-[24px]">
        {/* SEARCH + FILTERS */}
        <div className="border-b border-[var(--app-border-soft)] px-6 py-4">
          <div className="flex w-full flex-col gap-3 lg:max-w-xl lg:flex-row lg:items-center">
            <SearchBar placeholder="Buscar por nome, CPF, conta ou plano..." />
            <Link
              href="/dashboard/planos-ativos"
              prefetch
              className="inline-flex items-center justify-center rounded-[12px] border border-[var(--app-border-strong)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-hover)]"
            >
              Limpar
            </Link>
          </div>
        </div>

        {data.nelogicaError && (
          <div className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">API Nelogica indisponível</p>
              <p className="text-[12px] opacity-80">{data.nelogicaError}</p>
            </div>
          </div>
        )}

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            <thead className="theme-table-head">
              <tr className="theme-text-subtle text-left text-[11px] font-semibold uppercase tracking-[0.18em]">
                <th className="px-6 py-4">Subconta</th>
                <th className="px-4 py-4">Trader</th>
                <th className="px-4 py-4">Plataforma</th>
                <th className="px-4 py-4">Plano (Guru)</th>
                <th className="px-4 py-4">Início</th>
                <th className="px-4 py-4">Aprovação</th>
                <th className="px-4 py-4">Status</th>
                <th className="w-[60px] px-4 py-4 border-l border-[var(--app-border-soft)] text-center">Ações</th>
              </tr>
            </thead>

            <tbody>
              {data.plans.length === 0 ? (
                <tr className="border-t border-[var(--app-border-soft)]">
                  <td colSpan={8} className="px-6 py-14 text-center">
                    <div className="space-y-2">
                      <p className="theme-title text-base font-semibold">Nenhum trader encontrado.</p>
                      <p className="theme-text-subtle text-sm">
                        Ajuste a busca ou verifique a integração com a Nelogica.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.plans.map((p) => (
                  <tr
                    key={p.id}
                    className="theme-table-row border-t border-[var(--app-border-soft)] text-sm transition"
                  >
                    {/* Subconta */}
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="font-mono font-semibold text-[var(--app-text)]">{p.conta}</p>
                        {p.masterAccount && (
                          <p className="text-[11px] text-[var(--app-text-subtle)]">
                            Master <span className="font-mono">{p.masterAccount}</span>
                          </p>
                        )}
                        {p.masterAccountHolder && (
                          <p className="text-[11px] font-medium text-[var(--app-text)]">
                            {p.masterAccountHolder}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Trader */}
                    <td className="px-4 py-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-[var(--app-text)]">{p.studentName}</p>
                        {p.document && (
                          <p className="font-mono text-[11px] text-[var(--app-text-subtle)]">
                            {formatDocument(p.document)}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Plataforma */}
                    <td className="px-4 py-4">
                      <div className="space-y-0.5">
                        {p.nelogicaSubscriptionPlanName ? (
                          <p className="font-semibold text-[var(--app-text)]">
                            {p.nelogicaSubscriptionPlanName}
                          </p>
                        ) : (
                          <p className="text-[var(--app-text-subtle)]">—</p>
                        )}
                        <p className="text-[11px] text-[var(--app-text-subtle)]">{p.profitPlatform}</p>
                      </div>
                    </td>

                    {/* Plano (Guru) */}
                    <td className="px-4 py-4">
                      {p.guruPlanName ? (
                        <div className="space-y-0.5">
                          <p className="font-medium text-[var(--app-text)]">{p.guruPlanName}</p>
                          {p.guruStatus && (
                            <p className="text-[11px] text-[var(--app-text-subtle)]">{p.guruStatus}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[var(--app-text-subtle)]">Sem venda Guru</span>
                      )}
                    </td>

                    {/* Início */}
                    <td className="px-4 py-4 text-[13px] text-[var(--app-text-subtle)]">
                      {p.startedAt}
                    </td>

                    {/* Aprovação */}
                    <td className="px-4 py-4">
                      <ApprovalCell
                        enrollmentId={p.enrollmentId}
                        status={p.approvalStatus}
                        decidedAt={p.approvalDecidedAt}
                      />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {p.isNelogicaActive ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getSemanticStatusBadgeClass("Ativo")}`}
                            >
                              Ativo
                            </span>
                          </>
                        ) : (
                          <>
                            <CircleDashed className="h-4 w-4 text-[var(--app-text-subtle)]" />
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getSemanticStatusBadgeClass(p.nelogicaStatus ?? "Inativo")}`}
                            >
                              {p.nelogicaStatus ?? "Sem status"}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-4 border-l border-[var(--app-border-soft)] text-center">
                      <ActivePlansActionsMenu
                        isActive={p.isNelogicaActive}
                        provisionAction={async () => {
                          "use server";
                          await actionProvisionarLicenca(p.id);
                        }}
                        cancelAction={async () => {
                          "use server";
                          await actionCancelarLicenca(p.id, undefined);
                        }}
                      />
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
          itemsOnPage={data.plans.length}
          basePath="/dashboard/planos-ativos"
          extraParams={{ q: data.pagination.q }}
        />
      </section>
    </DashboardShell>
  );
}
