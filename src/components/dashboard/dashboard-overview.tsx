import {
  ArrowLeftRight,
  ClipboardList,
  ShoppingCart,
  UsersRound,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/app-shell";
import type { DashboardOverview } from "@/types/dashboard";

type DashboardOverviewProps = {
  data: DashboardOverview;
};

const guruMetricIcons = [UsersRound, ShoppingCart, ArrowLeftRight] as const;

export function DashboardOverviewView({ data }: DashboardOverviewProps) {
  const featuredPlans = data.plans.slice(0, 3);

  return (
    <DashboardShell company={data.company} pageTitle="Home">
      <div className="grid gap-6">
        <section className="space-y-6">
          <div className="theme-card rounded-[22px] p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-3">
                <span className="theme-accent-soft inline-flex rounded-lg px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]">
                  Operacao viva
                </span>
                <div className="space-y-2">
                  <h2 className="theme-title font-display text-3xl tracking-[-0.06em]">
                    Panorama real da plataforma
                  </h2>
                  <p className="theme-text-muted max-w-2xl text-sm leading-6">
                    Os indicadores abaixo refletem dados reais da Guru e da
                    operacao interna da MTCprop, sem cards decorativos de
                    atalho.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:w-[520px] 2xl:w-[600px]">
                {data.guruMetrics.map((metric, index) => {
                  const Icon = guruMetricIcons[index] ?? ArrowLeftRight;

                  return (
                    <div
                      key={metric.label}
                      className="theme-card-soft min-w-0 rounded-[18px] px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="theme-text-subtle truncate text-[10px] font-semibold uppercase tracking-[0.14em]">
                            {metric.label}
                          </p>
                          <p className="theme-title mt-2 text-[18px] font-semibold tracking-[-0.05em]">
                            {metric.value}
                          </p>
                        </div>
                        <div className="theme-accent-icon flex h-8 w-8 items-center justify-center rounded-xl">
                          <Icon className="h-[15px] w-[15px]" />
                        </div>
                      </div>
                      <p className="theme-text-subtle mt-2 line-clamp-2 text-[11px] leading-4">
                        {metric.trend}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {featuredPlans.map((plan) => (
              <article
                key={plan.name}
                className="theme-card-interactive rounded-[18px] p-5 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="theme-text-subtle text-[11px] font-semibold uppercase tracking-[0.18em]">
                      Plano em destaque
                    </p>
                    <h3 className="theme-title text-[1.15rem] font-semibold tracking-[-0.04em]">
                      {plan.name}
                    </h3>
                  </div>
                  <div className="theme-accent-icon flex h-11 w-11 items-center justify-center rounded-[14px]">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 text-sm">
                  <div className="theme-card-soft rounded-[16px] px-4 py-3">
                    <p className="theme-text-subtle text-[11px] font-semibold uppercase tracking-[0.18em]">
                      Traders ativos
                    </p>
                    <p className="theme-title mt-1 text-lg font-semibold tracking-[-0.04em]">
                      {plan.activeStudents}
                    </p>
                  </div>
                  <div className="theme-card-soft rounded-[16px] px-4 py-3">
                    <p className="theme-text-subtle text-[11px] font-semibold uppercase tracking-[0.18em]">
                      Receita estimada
                    </p>
                    <p className="theme-title mt-1 text-lg font-semibold tracking-[-0.04em]">
                      {plan.revenueShare}
                    </p>
                  </div>
                  <div className="theme-card-soft rounded-[16px] px-4 py-3">
                    <p className="theme-text-subtle text-[11px] font-semibold uppercase tracking-[0.18em]">
                      Limite do plano
                    </p>
                    <p className="theme-title mt-1 text-lg font-semibold tracking-[-0.04em]">
                      {plan.maxContracts}
                    </p>
                  </div>
                </div>

                <p className="theme-text-muted mt-4 text-sm leading-6">
                  {plan.highlight}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
