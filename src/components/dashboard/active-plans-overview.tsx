import {
  PlaySquare,
  StopCircle,
  ChevronLeft,
  ChevronRight,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/app-shell";
import { getSemanticStatusBadgeClass } from "@/components/dashboard/status-badge";
import { SearchBar } from "@/components/dashboard/search-bar";
import { actionCancelarLicenca, actionProvisionarLicenca } from "@/app/actions/nelogica-actions";
import type { ActivePlanListItem, ActivePlansOverview } from "@/lib/services/plans-service";

type ActivePlansOverviewProps = {
  data: ActivePlansOverview;
};

function buildPageHref(page: number, q?: string) {
  const params = new URLSearchParams();
  params.set("page", page.toString());
  if (q) params.set("q", q);
  return `/dashboard/planos-ativos?${params.toString()}`;
}

function getBalanceTone(value: number) {
  if (value > 0) return "text-emerald-600";
  if (value < 0) return "text-rose-600";
  return "text-[var(--app-text-subtle)]";
}

function getActionButtonTone(kind: "provision" | "cut") {
  if (kind === "provision") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/16";
  }

  return "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/16";
}

export function ActivePlansOverviewView({ data }: ActivePlansOverviewProps) {
  return (
    <DashboardShell company={data.company} pageTitle="Planos Ativos">
      <section className="theme-card overflow-hidden rounded-[24px]">
        <div className="border-b border-[var(--app-border-soft)] px-6 py-5">
          <div className="space-y-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="theme-title text-[1.65rem] font-semibold tracking-[-0.05em]">
                    Planos ativos
                  </h2>
                  <span className="theme-pill-soft theme-text-subtle inline-flex rounded-[999px] px-3 py-1 text-[12px] font-medium">
                    Nelogica
                  </span>
                </div>
                <p className="theme-text-subtle max-w-2xl text-sm">
                  Monitoramento operacional das contas ativas sincronizadas com a Nelogica,
                  mantendo a mesma linguagem visual das demais listas do painel.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="theme-pill-soft theme-text-subtle inline-flex rounded-[999px] px-3 py-2 text-sm font-medium">
                  {data.pagination.total} contas
                </span>
                <span className="theme-warning-box inline-flex items-center gap-2 rounded-[999px] px-3 py-2 text-sm font-medium">
                  <TriangleAlert className="h-4 w-4" />
                  Dados vivos + regra interna
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 lg:max-w-xl lg:flex-row lg:items-center">
              <SearchBar placeholder="Buscar conta, trader, plano..." />
              <Link
                href="/dashboard/planos-ativos"
                prefetch
                className="inline-flex items-center justify-center rounded-[12px] border border-[var(--app-border-strong)] bg-[var(--app-surface)] px-4 py-2 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-hover)]"
              >
                Limpar filtros
              </Link>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1420px] w-full">
            <thead className="theme-table-head">
              <tr className="theme-text-subtle text-left text-[11px] font-semibold uppercase tracking-[0.18em]">
                <th className="px-6 py-4">Conta</th>
                <th className="px-4 py-4">Nome</th>
                <th className="px-4 py-4">Perfil de Risco</th>
                <th className="px-4 py-4">Profit</th>
                <th className="px-4 py-4">Início</th>
                <th className="px-4 py-4">Plano</th>
                <th className="px-4 py-4">Limite Perda</th>
                <th className="px-4 py-4">Saldo Mensal</th>
                <th className="px-4 py-4">Saldo Total</th>
                <th className="px-4 py-4">Status Nelogica</th>
                <th className="px-6 py-4 border-l border-[var(--app-border-soft)]">Ações</th>
              </tr>
            </thead>

            <tbody>
              {data.plans.length === 0 ? (
                <tr className="border-t border-[var(--app-border-soft)]">
                  <td colSpan={11} className="px-6 py-14 text-center">
                    <div className="space-y-2">
                      <p className="theme-title text-base font-semibold">Nenhuma conta encontrada.</p>
                      <p className="theme-text-subtle text-sm">
                        Ajuste a busca ou verifique a integração com a Nelogica para trazer as contas ativas.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.plans.map((planContext) => (
                  <tr
                    key={planContext.enrollmentId}
                    className="theme-table-row border-t border-[var(--app-border-soft)] text-sm transition"
                  >
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-[var(--app-text)]">{planContext.conta}</p>
                        {planContext.nelogicaActivationCode ? (
                          <p className="font-mono text-[11px] text-[var(--app-text-subtle)]">
                            {planContext.nelogicaActivationCode}
                          </p>
                        ) : (
                          <p className="text-[11px] text-[var(--app-text-subtle)]">Sem activation code</p>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-[var(--app-text)]">{planContext.studentName}</p>
                        <p className="text-[12px] text-[var(--app-text-subtle)]">Conta operacional ativa</p>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full border border-[var(--app-border-soft)] bg-[var(--app-surface-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-text)]">
                        {planContext.riskProfile}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="font-medium text-[var(--app-text)]">{planContext.profitPlatform}</p>
                        <p className="text-[12px] text-[var(--app-text-subtle)]">Plataforma vinda da conta Nelogica</p>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-[13px] text-[var(--app-text-subtle)]">{planContext.startedAt}</span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="font-medium text-[var(--app-text)]">{planContext.planName}</p>
                        <p className="text-[12px] text-[var(--app-text-subtle)]">Plano interno vinculado ao enrollment</p>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-semibold text-[var(--app-text)]">{planContext.limitLoss}</span>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`font-semibold ${getBalanceTone(planContext.monthlyBalanceValue)}`}>
                        {planContext.monthlyBalance}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`font-semibold ${getBalanceTone(planContext.totalBalanceValue)}`}>
                        {planContext.totalBalance}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getSemanticStatusBadgeClass(
                            planContext.nelogicaLiveStatusLabel ?? planContext.nelogicaStatus,
                          )}`}
                        >
                          {planContext.nelogicaLiveStatusLabel ?? planContext.nelogicaStatus ?? "Sem status"}
                        </span>

                        {planContext.nelogicaLiveStatusLabel && planContext.nelogicaStatus ? (
                          <p className="text-[11px] text-[var(--app-text-subtle)]">
                            Snapshot interno: {planContext.nelogicaStatus}
                          </p>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-6 py-4 border-l border-[var(--app-border-soft)]">
                      <div className="flex flex-wrap gap-2">
                        <form
                          action={async () => {
                            "use server";
                            await actionProvisionarLicenca(planContext.id);
                          }}
                        >
                          <button
                            type="submit"
                            disabled={
                              planContext.nelogicaLiveStatusCode === "3" ||
                              planContext.nelogicaStatus === "ACTIVE"
                            }
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition disabled:cursor-not-allowed disabled:opacity-50 ${getActionButtonTone(
                              "provision",
                            )}`}
                          >
                            <PlaySquare className="h-3 w-3" />
                            Provisionar
                          </button>
                        </form>

                        <form
                          action={async () => {
                            "use server";
                            await actionCancelarLicenca(planContext.id, undefined);
                          }}
                        >
                          <button
                            type="submit"
                            disabled={
                              planContext.nelogicaLiveStatusCode !== "3" &&
                              planContext.nelogicaStatus !== "ACTIVE"
                            }
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition disabled:cursor-not-allowed disabled:opacity-50 ${getActionButtonTone(
                              "cut",
                            )}`}
                          >
                            <StopCircle className="h-3 w-3" />
                            Cortar
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--app-border-soft)] px-6 py-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="theme-pill-soft theme-text-subtle inline-flex rounded-[999px] px-3 py-2 text-sm font-medium">
              Exibindo {data.plans.length} de {data.pagination.total} contas
            </span>
            <span className="theme-text-subtle text-sm">
              Página {data.pagination.page} de {data.pagination.totalPages}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Link
              href={
                data.pagination.hasPreviousPage
                  ? buildPageHref(data.pagination.page - 1, data.pagination.q)
                  : "#"
              }
              prefetch={data.pagination.hasPreviousPage}
              aria-disabled={!data.pagination.hasPreviousPage}
              className={`inline-flex items-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-medium transition ${
                data.pagination.hasPreviousPage
                  ? "theme-card-soft theme-text border-[var(--app-border-strong)] hover:bg-[var(--app-hover)]"
                  : "cursor-not-allowed border-[var(--app-border-soft)] bg-[var(--app-surface-soft)] text-[var(--app-text-subtle)]"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Link>

            <Link
              href={
                data.pagination.hasNextPage
                  ? buildPageHref(data.pagination.page + 1, data.pagination.q)
                  : "#"
              }
              prefetch={data.pagination.hasNextPage}
              aria-disabled={!data.pagination.hasNextPage}
              className={`inline-flex items-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-medium transition ${
                data.pagination.hasNextPage
                  ? "theme-card-soft theme-text border-[var(--app-border-strong)] hover:bg-[var(--app-hover)]"
                  : "cursor-not-allowed border-[var(--app-border-soft)] bg-[var(--app-surface-soft)] text-[var(--app-text-subtle)]"
              }`}
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
