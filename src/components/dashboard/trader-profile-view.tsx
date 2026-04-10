import {
  ArrowLeft,
  FileSpreadsheet,
  MessageSquareText,
  ShieldCheck,
  Ticket,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/app-shell";
import { getSemanticStatusBadgeClass } from "@/components/dashboard/status-badge";
import type {
  TraderEticketRecord,
  TraderProfileOverview,
  TraderProfileTab,
  TraderSaleRecord,
} from "@/types/traders";

type TraderProfileViewProps = {
  data: TraderProfileOverview;
  activeTab: TraderProfileTab;
};

const TAB_ITEMS: Array<{ key: TraderProfileTab; label: string }> = [
  { key: "detail", label: "Detalhe" },
  { key: "sales", label: "Vendas" },
  { key: "etickets", label: "E-Tickets" },
  { key: "comments", label: "Comentarios" },
  { key: "audit", label: "Auditoria" },
];

function buildTraderTabHref(traderId: string, tab: TraderProfileTab) {
  return `/dashboard/traders/${traderId}?tab=${tab}`;
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="border-b border-[var(--app-border-soft)] pb-4">
      <p className="theme-text-subtle text-sm font-medium">{label}</p>
      <p className="theme-title mt-2 text-[15px] font-medium">
        {value && value.trim() ? value : "Nao informado"}
      </p>
    </div>
  );
}

function StatBadge({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof WalletCards;
  label: string;
  value: string;
}) {
  return (
    <div className="theme-accent-soft inline-flex items-center gap-3 rounded-[14px] px-4 py-3">
      <div className="theme-accent-icon flex h-10 w-10 items-center justify-center rounded-[12px]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="theme-text-subtle text-[11px] font-semibold uppercase tracking-[0.2em]">
          {label}
        </p>
        <p className="theme-title mt-1 text-base font-semibold">{value}</p>
      </div>
    </div>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof MessageSquareText;
  title: string;
  description: string;
  action?: string;
}) {
  return (
    <section className="theme-card rounded-[24px] p-6">
      <div className="flex flex-col items-start gap-4">
        <div className="theme-accent-icon flex h-12 w-12 items-center justify-center rounded-[14px]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="theme-title text-xl font-semibold tracking-[-0.04em]">
            {title}
          </h3>
          <p className="theme-text-muted mt-2 max-w-2xl text-sm leading-6">
            {description}
          </p>
        </div>
        {action ? (
          <span className="theme-pill-soft theme-text-subtle inline-flex rounded-[12px] px-3 py-2 text-xs font-medium">
            {action}
          </span>
        ) : null}
      </div>
    </section>
  );
}

function SalesTable({ sales }: { sales: TraderSaleRecord[] }) {
  return (
    <section className="theme-card rounded-[24px] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--app-border-soft)] px-6 py-5">
        <div>
          <div className="mb-3 h-[2px] w-10 rounded-full bg-[var(--brand)]" />
          <h3 className="theme-title text-[30px] font-semibold tracking-[-0.05em]">
            Vendas
          </h3>
          <p className="theme-text-subtle mt-2 text-sm">
            {sales.length} {sales.length === 1 ? "venda encontrada" : "vendas encontradas"}
          </p>
        </div>

        <span className="theme-accent-soft inline-flex items-center gap-2 rounded-[12px] px-4 py-2 text-sm font-medium">
          <FileSpreadsheet className="h-4 w-4" />
          XLS
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full">
          <thead className="theme-table-head">
            <tr className="theme-text-subtle text-left text-[11px] font-semibold uppercase tracking-[0.18em]">
              <th className="px-6 py-4">Codigo</th>
              <th className="px-4 py-4">Produto</th>
              <th className="px-4 py-4">Criada em</th>
              <th className="px-4 py-4">Valor</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {sales.length > 0 ? (
              sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="theme-table-row border-t border-[var(--app-border-soft)] text-sm"
                >
                  <td className="px-6 py-5">
                    <Link
                      href={`/dashboard/vendas/${encodeURIComponent(sale.id)}`}
                      className="theme-link theme-title font-medium"
                    >
                      {sale.code}
                    </Link>
                  </td>
                  <td className="px-4 py-5">
                    <p className="theme-text">{sale.productName}</p>
                  </td>
                  <td className="px-4 py-5">
                    <p className="theme-text">{sale.createdAt || "Sem data"}</p>
                  </td>
                  <td className="px-4 py-5">
                    <p className="theme-title font-medium">{sale.amountLabel}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex rounded-[999px] border px-3 py-1 text-xs font-medium capitalize ${getSemanticStatusBadgeClass(
                        sale.statusLabel,
                      )}`}
                    >
                      {sale.statusLabel || "Nao informado"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="theme-text-subtle px-6 py-12 text-center text-sm"
                >
                  Nenhuma venda encontrada para este contato na Guru.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EticketsTable({ etickets }: { etickets: TraderEticketRecord[] }) {
  return (
    <section className="theme-card rounded-[24px] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--app-border-soft)] px-6 py-5">
        <div>
          <div className="mb-3 h-[2px] w-10 rounded-full bg-[var(--brand)]" />
          <h3 className="theme-title text-[30px] font-semibold tracking-[-0.05em]">
            E-tickets
          </h3>
          <p className="theme-text-subtle mt-2 text-sm">
            {etickets.length} {etickets.length === 1 ? "registro" : "registros"}
          </p>
        </div>

        <button
          type="button"
          disabled
          className="theme-pill-soft theme-text-subtle inline-flex items-center gap-2 rounded-[12px] px-4 py-2 text-sm font-medium opacity-70"
        >
          <Ticket className="h-4 w-4" />
          Gerar E-tickets
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full">
          <thead className="theme-table-head">
            <tr className="theme-text-subtle text-left text-[11px] font-semibold uppercase tracking-[0.18em]">
              <th className="px-6 py-4">Codigo</th>
              <th className="px-4 py-4">Data</th>
              <th className="px-4 py-4">Produto</th>
              <th className="px-4 py-4">Participante</th>
              <th className="px-4 py-4">Email</th>
              <th className="px-6 py-4">Celular</th>
            </tr>
          </thead>
          <tbody>
            {etickets.length > 0 ? (
              etickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="theme-table-row border-t border-[var(--app-border-soft)] text-sm"
                >
                  <td className="px-6 py-5">{ticket.code}</td>
                  <td className="px-4 py-5">{ticket.createdAt || "Sem data"}</td>
                  <td className="px-4 py-5">{ticket.productName}</td>
                  <td className="px-4 py-5">{ticket.participantName}</td>
                  <td className="px-4 py-5">{ticket.email}</td>
                  <td className="px-6 py-5">{ticket.phone}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="theme-text-subtle px-6 py-12 text-center text-sm"
                >
                  Sem dados a exibir.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function TraderProfileView({
  data,
  activeTab,
}: TraderProfileViewProps) {
  const { trader } = data;

  return (
    <DashboardShell company={data.company} pageTitle="Traders">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard/traders"
              className="theme-link inline-flex items-center gap-2 text-sm font-medium transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para traders
            </Link>
            <h2 className="theme-title mt-3 text-3xl font-semibold tracking-[-0.06em]">
              {trader.name}
            </h2>
            <p className="theme-text-muted mt-2 text-sm">
              Perfil detalhado do contato sincronizado com a Guru.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatBadge icon={WalletCards} label="Vendas" value={String(data.sales.length)} />
            <StatBadge icon={Ticket} label="E-tickets" value={String(data.etickets.length)} />
          </div>
        </div>

        <div className="theme-shell-surface rounded-[22px] border border-[var(--app-border-soft)] px-4 py-3 sm:px-6">
          <div className="flex flex-wrap gap-2 sm:gap-5">
            {TAB_ITEMS.map((tab) => {
              const isActive = tab.key === activeTab;

              return (
                <Link
                  key={tab.key}
                  href={buildTraderTabHref(trader.id, tab.key)}
                  className={`border-b-2 px-1 py-2 text-sm font-medium transition ${
                    isActive
                      ? "border-[var(--brand)] text-[var(--brand)]"
                      : "border-transparent text-[var(--app-text-muted)] hover:text-[var(--app-text)]"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        {activeTab === "detail" ? (
          <div className="space-y-6">
            <section className="theme-card rounded-[24px] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="mb-3 h-[2px] w-10 rounded-full bg-[var(--brand)]" />
                  <h3 className="theme-title text-[30px] font-semibold tracking-[-0.05em]">
                    Dados pessoais
                  </h3>
                </div>

                <div className="theme-accent-soft inline-flex items-center gap-2 rounded-[999px] px-4 py-2 text-sm font-medium">
                  <WalletCards className="h-4 w-4" />
                  Contato Guru
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <DetailField label="Nome" value={trader.name} />
                <DetailField label="Email" value={trader.email} />
                <DetailField label="Documento" value={trader.document} />
                <DetailField label="Celular" value={trader.phone} />
              </div>
            </section>

            <section className="theme-card rounded-[24px] p-6">
              <div className="mb-6">
                <div className="mb-3 h-[2px] w-10 rounded-full bg-[var(--brand)]" />
                <h3 className="theme-title text-[30px] font-semibold tracking-[-0.05em]">
                  Endereco
                </h3>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <DetailField label="Pais" value={trader.country} />
                <DetailField label="Rua" value={trader.street} />
                <DetailField label="Numero" value={trader.number} />
                <DetailField label="Complemento" value={trader.complement} />
                <DetailField label="Bairro" value={trader.district} />
                <DetailField label="Cidade" value={trader.city} />
                <DetailField label="Estado" value={trader.state} />
                <DetailField label="CEP" value={trader.zipcode} />
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "sales" ? <SalesTable sales={data.sales} /> : null}

        {activeTab === "etickets" ? <EticketsTable etickets={data.etickets} /> : null}

        {activeTab === "comments" ? (
          <EmptyPanel
            icon={MessageSquareText}
            title="Comentarios"
            description="A estrutura da aba de comentarios ja esta pronta, mas a origem e o fluxo de cadastro ainda nao foram definidos. Assim que essa regra operacional for fechada, esta tela recebe historico e composicao dos registros."
            action="Em definicao"
          />
        ) : null}

        {activeTab === "audit" ? (
          <EmptyPanel
            icon={ShieldCheck}
            title="Auditoria"
            description="A base visual ja foi criada para a auditoria individual do trader. O proximo passo sera ligar eventos operacionais reais, como alteracoes de cadastro, provisionamento e interacoes administrativas."
            action="Estrutura pronta para evolucao"
          />
        ) : null}
      </div>
    </DashboardShell>
  );
}
