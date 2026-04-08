import {
  ArrowRight,
  BookMarked,
  CircleDollarSign,
  FileText,
  FolderLock,
  GraduationCap,
  Headset,
  Link2,
  MonitorPlay,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/app-shell";
import type { DashboardOverview } from "@/types/dashboard";

type DashboardOverviewProps = {
  data: DashboardOverview;
};

const usefulLinks = [
  {
    title: "Manual do Trader",
    description: "Diretrizes operacionais",
    icon: BookMarked,
    href: "#",
  },
  {
    title: "Regulamento Geral",
    description: "Regras internas",
    icon: FileText,
    href: "#",
  },
  {
    title: "Ciclos de Pagamento",
    description: "Repasses e quinzena",
    icon: CircleDollarSign,
    href: "#",
  },
  {
    title: "Solicitacoes",
    description: "Fluxos operacionais",
    icon: ShieldCheck,
    href: "#",
  },
  {
    title: "Biblioteca",
    description: "Treinamentos e aulas",
    icon: MonitorPlay,
    href: "#",
  },
  {
    title: "Sala ao Vivo",
    description: "Links principais",
    icon: Link2,
    href: "#",
  },
  {
    title: "Suporte",
    description: "Atendimento interno",
    icon: Headset,
    href: "#",
  },
  {
    title: "Documentos",
    description: "Materiais oficiais",
    icon: FileText,
    href: "#",
  },
];

export function DashboardOverviewView({ data }: DashboardOverviewProps) {
  const quickActions = [
    {
      title: "Alunos",
      description: `${data.kpis[0]?.value ?? "0"} ativos na base`,
      icon: UsersRound,
      accent: "Gerenciar cadastros e etapas",
    },
    {
      title: "Inscricoes",
      description: `${data.kpis[1]?.value ?? "0"} em andamento`,
      icon: GraduationCap,
      accent: "Acompanhar onboarding e planos",
    },
    {
      title: "Acessos",
      description: `${data.kpis[2]?.value ?? "0"} liberados`,
      icon: FolderLock,
      accent: "Controlar modulos e permissoes",
    },
  ];

  return (
    <DashboardShell company={data.company} pageTitle="Home">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="theme-card rounded-[22px] p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-3">
                <span className="theme-accent-soft inline-flex rounded-lg px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]">
                  Base operacional
                </span>
                <div className="space-y-2">
                  <h2 className="theme-title font-display text-3xl tracking-[-0.06em]">
                    Acesso rapido do painel interno
                  </h2>
                  <p className="theme-text-muted max-w-2xl text-sm leading-6">
                    Essa estrutura passa a ser a base do app depois do login:
                    simples, clara e focada em acao para o time da MTCprop.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:w-[360px]">
                {data.kpis.slice(0, 3).map((kpi) => (
                  <div
                    key={kpi.label}
                    className="theme-card-soft rounded-[18px] px-4 py-3"
                  >
                    <p className="theme-text-subtle text-[11px] font-semibold uppercase tracking-[0.18em]">
                      {kpi.label}
                    </p>
                    <p className="theme-title mt-2 text-lg font-semibold tracking-[-0.04em]">
                      {kpi.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {quickActions.map(({ title, description, icon: Icon, accent }) => (
              <article
                key={title}
                className="theme-card-interactive rounded-[18px] p-5 transition"
              >
                <div className="theme-accent-icon mb-5 flex h-11 w-11 items-center justify-center rounded-[14px]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="theme-title text-[1.15rem] font-semibold tracking-[-0.04em]">
                  {title}
                </h3>
                <p className="theme-text-muted mt-2 text-sm leading-6">
                  {description}
                </p>
                <div className="theme-accent-text mt-5 flex items-center justify-between text-sm font-medium">
                  <span>{accent}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="theme-title text-2xl font-semibold tracking-[-0.05em]">
              Links uteis
            </h2>
            <span className="theme-text-subtle text-sm">Acessos rapidos</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {usefulLinks.map(({ title, description, icon: Icon, href }) => (
              <a
                key={title}
                href={href}
                className="theme-card-interactive group rounded-[18px] p-4 transition"
              >
                <div className="flex min-h-[128px] flex-col justify-between">
                  <div className="space-y-2">
                    <p className="theme-text text-sm font-medium leading-5">
                      {title}
                    </p>
                    <p className="theme-text-subtle text-sm">{description}</p>
                  </div>
                  <div className="theme-text flex justify-center pt-6 transition group-hover:text-[var(--app-accent-text)]">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
