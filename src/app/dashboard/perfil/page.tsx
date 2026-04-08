import {
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
  Waypoints,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/app-shell";
import { requireCurrentAdminUser } from "@/lib/auth/server";
import { getDashboardOverview } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function DashboardProfilePage() {
  const data = await getDashboardOverview();
  const adminUser = await requireCurrentAdminUser();
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
  const profileItems = [
    {
      label: "Perfil",
      value:
        adminUser.role === "OWNER" ? "Owner do sistema" : "Administrador interno",
      icon: UserRound,
    },
    {
      label: "Contato",
      value: adminUser.email,
      icon: Mail,
    },
    {
      label: "Ambiente",
      value:
        process.env.NODE_ENV === "production"
          ? "Ambiente de producao"
          : "Ambiente local de desenvolvimento",
      icon: Waypoints,
    },
  ];
  const securityItems = [
    {
      title: "Sessao ativa",
      description:
        "Sua sessao agora usa JWT em cookie HttpOnly, com protecao antes da renderizacao e validacao novamente no servidor.",
      icon: ShieldCheck,
    },
    {
      title: "Credenciais",
      description:
        "Os acessos administrativos estao restritos a usuarios internos previamente cadastrados e as senhas ficam salvas apenas em hash no banco.",
      icon: KeyRound,
    },
  ];

  return (
    <DashboardShell company={data.company} pageTitle="My Profile">
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="theme-card rounded-[22px] p-6">
          <span className="theme-accent-soft inline-flex rounded-[10px] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]">
            Area pessoal
          </span>

          <div className="mt-4 space-y-3">
            <h2 className="theme-title font-display text-3xl tracking-[-0.06em]">
              Perfil administrativo
            </h2>
            <p className="theme-text-muted max-w-2xl text-sm leading-6">
              Esse espaco agora reflete o usuario autenticado no sistema
              interno da MTCprop, incluindo sessao protegida e dados reais do
              acesso administrativo.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {profileItems.map(({ label, value, icon: Icon }) => (
              <article
                key={label}
                className="theme-card-soft rounded-[18px] p-4"
              >
                <div className="theme-accent-icon flex h-11 w-11 items-center justify-center rounded-[14px]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="theme-text-subtle mt-4 text-[11px] font-semibold uppercase tracking-[0.18em]">
                  {label}
                </p>
                <p className="theme-title mt-2 text-[15px] font-semibold leading-6">
                  {value}
                </p>
              </article>
            ))}
          </div>

        <div className="theme-card-soft theme-text-muted mt-6 rounded-[18px] px-4 py-4 text-sm leading-6">
          <p>
            Nome:{" "}
            <span className="theme-title font-semibold">{adminUser.name}</span>
          </p>
          <p>
            Empresa: <span className="theme-title font-semibold">{data.company.name}</span>
          </p>
          <p>
            Ultimo login:{" "}
            <span className="theme-title font-semibold">
              {adminUser.lastLoginAt
                ? formatter.format(adminUser.lastLoginAt)
                : "Primeiro acesso ainda nao registrado"}
            </span>
          </p>
          <p>
            Site principal:{" "}
            <a
                href={data.company.website}
                target="_blank"
                rel="noreferrer"
                className="theme-link font-semibold transition"
              >
                {data.company.website}
              </a>
            </p>
          </div>
        </section>

        <section className="theme-card rounded-[22px] p-6">
          <div className="space-y-2">
            <h3 className="theme-title text-xl font-semibold tracking-[-0.04em]">
              Seguranca e acesso
            </h3>
            <p className="theme-text-muted text-sm leading-6">
              Camada atual de seguranca do login interno e base para evoluirmos
              depois com troca de senha e permissao por colaborador.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {securityItems.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="theme-card-soft rounded-[18px] p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="theme-accent-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="theme-title font-semibold">{title}</p>
                    <p className="theme-text-muted mt-2 text-sm leading-6">
                      {description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
