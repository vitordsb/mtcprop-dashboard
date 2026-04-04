import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  ShieldAlert,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/app-shell";
import type { TradersOverview } from "@/types/traders";

type TradersOverviewProps = {
  data: TradersOverview;
};

function getStageClass(stage: string) {
  if (stage === "Mesa real") {
    return "border-[#c9f0d1] bg-[#eefcf1] text-[#156624]";
  }

  if (stage === "Simulador") {
    return "border-[#d9dcff] bg-[#f2f3ff] text-[#4052c8]";
  }

  if (stage === "Avaliacao") {
    return "border-[#f6dfb3] bg-[#fff7e6] text-[#9a6610]";
  }

  return "border-[#dde4df] bg-[#f7faf8] text-[#617363]";
}

function getOriginClass(origin: string) {
  if (origin === "Conta real") {
    return "border-[#c9f0d1] bg-[#eefcf1] text-[#156624]";
  }

  if (origin === "Fast") {
    return "border-[#ead6ff] bg-[#f7efff] text-[#8a43d1]";
  }

  return "border-[#dde4df] bg-[#f7faf8] text-[#617363]";
}

function buildPageHref(page: number) {
  return `/dashboard/traders?page=${page}`;
}

export function TradersOverviewView({ data }: TradersOverviewProps) {
  const { pagination } = data;

  return (
    <DashboardShell company={data.company} pageTitle="Traders">
      <section className="theme-card overflow-hidden rounded-[24px]">
        <div className="border-b border-[var(--app-border-soft)] px-6 pt-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-8">
                <div className="border-b-2 border-[#4a67ff] pb-3">
                  <p className="text-sm font-semibold text-[#4a67ff]">
                    Traders ativos
                  </p>
                </div>
                <p className="pb-3 text-sm font-medium text-[#9aa7a0]">
                  Visão operacional
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pb-5">
                <div className="theme-card-soft theme-text inline-flex items-center gap-2 rounded-[12px] px-3 py-2 text-sm font-medium">
                  <UsersRound className="h-4 w-4 text-[#4a67ff]" />
                  {pagination.total} traders
                </div>
                <div className="theme-card-soft theme-text-muted inline-flex items-center gap-2 rounded-[12px] px-3 py-2 text-sm">
                  Página {pagination.page} de {pagination.totalPages}
                </div>
              </div>
            </div>

            <div className="theme-text-subtle pb-5 text-sm">
              Exibindo 10 registros por página para manter a consulta leve.
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full">
            <thead className="theme-table-head">
              <tr className="theme-text-subtle text-left text-[11px] font-semibold uppercase tracking-[0.18em]">
                <th className="px-6 py-4">Trader</th>
                <th className="px-4 py-4">Plano</th>
                <th className="px-4 py-4">Início</th>
                <th className="px-4 py-4">Tipo</th>
                <th className="px-4 py-4">Etapa</th>
                <th className="px-4 py-4">Acessos</th>
                <th className="px-4 py-4">Mensalidade</th>
                <th className="px-6 py-4">Observações</th>
              </tr>
            </thead>
            <tbody>
              {data.traders.map((trader) => (
                <tr
                  key={trader.id}
                  className="theme-table-row border-t border-[var(--app-border-soft)] text-sm transition"
                >
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="theme-title font-semibold">{trader.name}</p>
                      <p className="theme-text-subtle text-[13px]">{trader.email}</p>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <p className="theme-text font-medium">{trader.plan}</p>
                    <p className="theme-text-subtle mt-1 text-[12px]">
                      {trader.historyCount > 1
                        ? `${trader.historyCount} históricos`
                        : "Base única"}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <div className="theme-text-muted inline-flex items-center gap-2 text-[13px]">
                      <CalendarClock className="h-4 w-4 text-[#8fa099]" />
                      {trader.startedAt}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getOriginClass(trader.origin)}`}
                    >
                      {trader.origin}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getStageClass(trader.stage)}`}
                    >
                      {trader.stage}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-2 text-[13px] font-medium text-[#244029]">
                        <UsersRound className="h-4 w-4 text-[#3c8b4a]" />
                        {trader.accessActive} liberados
                      </div>
                      <div className="inline-flex items-center gap-2 text-[13px] font-medium text-[#8a5b08]">
                        <ShieldAlert className="h-4 w-4" />
                        {trader.accessPending} pendentes
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="theme-text font-medium">
                        {trader.nextMonthlyDue}
                      </p>
                      <p className="theme-text-subtle text-[12px]">
                        Próxima cobrança
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {trader.restartUsed ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d9dcff] bg-[#f2f3ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4052c8]">
                          <RefreshCcw className="h-3.5 w-3.5" />
                          Reinício
                        </span>
                      ) : null}
                      {trader.sourceSheets.length > 0 ? (
                        <span className="inline-flex rounded-full border border-[#dde4df] bg-[#f7faf8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#617363]">
                          {trader.sourceSheets[0]}
                        </span>
                      ) : null}
                      {!trader.restartUsed && trader.sourceSheets.length === 0 ? (
                        <span className="inline-flex rounded-full border border-[#dde4df] bg-[#f7faf8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#617363]">
                          Sem alertas
                        </span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--app-border-soft)] px-6 py-4">
          <div className="flex items-center justify-center gap-3">
            <Link
              href={pagination.hasPreviousPage ? buildPageHref(pagination.page - 1) : "#"}
              aria-disabled={!pagination.hasPreviousPage}
              className={`inline-flex items-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-medium transition ${
                pagination.hasPreviousPage
                  ? "theme-card-soft theme-text border-[var(--app-border-strong)] hover:bg-[var(--app-hover)]"
                  : "cursor-not-allowed border-[var(--app-border-soft)] bg-[var(--app-surface-soft)] text-[var(--app-text-subtle)]"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Link>

            <span className="theme-text-muted min-w-[120px] text-center text-sm font-medium">
              Página {pagination.page}
            </span>

            <Link
              href={pagination.hasNextPage ? buildPageHref(pagination.page + 1) : "#"}
              aria-disabled={!pagination.hasNextPage}
              className={`inline-flex items-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-medium transition ${
                pagination.hasNextPage
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
