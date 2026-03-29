import {
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
  Waypoints,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/app-shell";
import { getDashboardOverview } from "@/lib/api";

export const dynamic = "force-dynamic";

const profileItems = [
  {
    label: "Perfil",
    value: "Administrador interno",
    icon: UserRound,
  },
  {
    label: "Contato",
    value: "suporte@mtcprop.com.br",
    icon: Mail,
  },
  {
    label: "Ambiente",
    value: "Painel local de homologacao",
    icon: Waypoints,
  },
];

const securityItems = [
  {
    title: "Sessao ativa",
    description:
      "Esse acesso continua local por enquanto. Quando conectarmos a autenticacao real, o logout vai invalidar a sessao do backend tambem.",
    icon: ShieldCheck,
  },
  {
    title: "Credenciais",
    description:
      "A pagina de perfil ja fica preparada para receber troca de senha, permissoes e historico de acessos nas proximas etapas.",
    icon: KeyRound,
  },
];

export default async function DashboardProfilePage() {
  const data = await getDashboardOverview();

  return (
    <DashboardShell company={data.company} pageTitle="My Profile">
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-[22px] border border-[#dfe8e0] bg-white p-6 shadow-[0_18px_40px_rgba(12,25,13,0.05)]">
          <span className="inline-flex rounded-[10px] border border-[rgba(69,225,95,0.2)] bg-[rgba(69,225,95,0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#176124]">
            Area pessoal
          </span>

          <div className="mt-4 space-y-3">
            <h2 className="font-display text-3xl tracking-[-0.06em] text-[#091309]">
              Base do perfil administrativo
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-[#627364]">
              Esse espaco passa a centralizar os dados do usuario conectado.
              Nesta primeira fase, deixei a estrutura pronta para evoluirmos com
              autenticao real, permissoes e dados pessoais vindos da API.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {profileItems.map(({ label, value, icon: Icon }) => (
              <article
                key={label}
                className="rounded-[18px] border border-[#e8eee8] bg-[#fbfdfb] p-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[rgba(69,225,95,0.1)] text-[#176124]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6c7e6e]">
                  {label}
                </p>
                <p className="mt-2 text-[15px] font-semibold leading-6 text-[#0c160d]">
                  {value}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-[18px] border border-[#e8eee8] bg-[#f8fbf8] px-4 py-4 text-sm leading-6 text-[#607162]">
            <p>
              Empresa: <span className="font-semibold text-[#0c160d]">{data.company.name}</span>
            </p>
            <p>
              Site principal:{" "}
              <a
                href={data.company.website}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#176124] transition hover:text-[#071108]"
              >
                {data.company.website}
              </a>
            </p>
          </div>
        </section>

        <section className="rounded-[22px] border border-[#dfe8e0] bg-white p-6 shadow-[0_18px_40px_rgba(12,25,13,0.05)]">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold tracking-[-0.04em] text-[#0c160d]">
              Seguranca e acesso
            </h3>
            <p className="text-sm leading-6 text-[#627364]">
              Componentes iniciais para a parte de credenciais e sessao do
              usuario interno.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {securityItems.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-[18px] border border-[#e8eee8] bg-[#fbfdfb] p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[rgba(69,225,95,0.1)] text-[#176124]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0c160d]">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#627364]">
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
