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
          <div className="rounded-[22px] border border-[#dfe8e0] bg-white p-6 shadow-[0_18px_40px_rgba(12,25,13,0.05)]">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-3">
                <span className="inline-flex rounded-lg border border-[rgba(69,225,95,0.18)] bg-[rgba(69,225,95,0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#176124]">
                  Base operacional
                </span>
                <div className="space-y-2">
                  <h2 className="font-display text-3xl tracking-[-0.06em] text-[#091309]">
                    Acesso rapido do painel interno
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-[#627364]">
                    Essa estrutura passa a ser a base do app depois do login:
                    simples, clara e focada em acao para o time da MTCprop.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:w-[360px]">
                {data.kpis.slice(0, 3).map((kpi) => (
                  <div
                    key={kpi.label}
                    className="rounded-[18px] border border-[#e5ece5] bg-[#f8fbf8] px-4 py-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#718473]">
                      {kpi.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-[#0d170e]">
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
                className="rounded-[18px] border border-[#e1e8e2] bg-white p-5 shadow-[0_14px_30px_rgba(12,25,13,0.04)] transition hover:border-[#cfe1d1] hover:shadow-[0_18px_36px_rgba(12,25,13,0.06)]"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[14px] bg-[rgba(69,225,95,0.1)] text-[#176124]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-[1.15rem] font-semibold tracking-[-0.04em] text-[#0c160d]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#5d6e5f]">
                  {description}
                </p>
                <div className="mt-5 flex items-center justify-between text-sm font-medium text-[#176124]">
                  <span>{accent}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-[-0.05em] text-[#0c160d]">
              Links uteis
            </h2>
            <span className="text-sm text-[#6d7f6f]">Acessos rapidos</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {usefulLinks.map(({ title, description, icon: Icon, href }) => (
              <a
                key={title}
                href={href}
                className="group rounded-[18px] border border-[#e1e8e2] bg-white p-4 shadow-[0_14px_30px_rgba(12,25,13,0.04)] transition hover:border-[#cfe1d1] hover:shadow-[0_18px_36px_rgba(12,25,13,0.06)]"
              >
                <div className="flex min-h-[128px] flex-col justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium leading-5 text-[#39493b]">
                      {title}
                    </p>
                    <p className="text-sm text-[#7b8b7d]">{description}</p>
                  </div>
                  <div className="flex justify-center pt-6 text-[#0d170e] transition group-hover:text-[#176124]">
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
