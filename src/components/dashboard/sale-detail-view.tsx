import {
  ArrowLeft,
  CreditCard,
  Landmark,
  MessageSquareText,
  QrCode,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/app-shell";
import type { SaleDetailOverview, SaleDetailTab } from "@/types/sales";

type SaleDetailViewProps = {
  data: SaleDetailOverview;
  activeTab: SaleDetailTab;
};

const TAB_ITEMS: Array<{ key: SaleDetailTab; label: string }> = [
  { key: "detail", label: "Detalhe" },
  { key: "buyer", label: "Comprador" },
  { key: "extras", label: "Extras" },
  { key: "comments", label: "Comentários" },
  { key: "audit", label: "Auditoria" },
];

function buildSaleTabHref(saleId: string, tab: SaleDetailTab) {
  return `/dashboard/vendas/${saleId}?tab=${tab}`;
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="border-b border-[var(--app-border-soft)] pb-4">
      <p className="theme-text-subtle text-sm font-medium">{label}</p>
      <p className="theme-title mt-2 text-[15px] font-medium">
        {value && value.trim() ? value : "—"}
      </p>
    </div>
  );
}

function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="theme-card rounded-[24px] p-6">
      <div className="theme-accent-icon flex h-12 w-12 items-center justify-center rounded-[14px]">
        <MessageSquareText className="h-5 w-5" />
      </div>
      <h3 className="theme-title mt-4 text-xl font-semibold tracking-[-0.04em]">{title}</h3>
      <p className="theme-text-muted mt-2 max-w-2xl text-sm leading-6">{description}</p>
    </section>
  );
}

function getPaymentIcon(method: string | null) {
  switch (method) {
    case "credit_card":
      return <CreditCard className="h-4 w-4" />;
    case "pix":
      return <QrCode className="h-4 w-4" />;
    case "billet":
      return <ReceiptText className="h-4 w-4" />;
    case "bank_transfer":
      return <Landmark className="h-4 w-4" />;
    default:
      return <WalletCards className="h-4 w-4" />;
  }
}

function StatusPill({
  label,
  code,
}: {
  label: string | null;
  code: string | null;
}) {
  const normalized = (code ?? "").toLowerCase();
  const className = normalized === "approved" || normalized === "completed"
    ? "bg-[rgba(63,184,107,0.14)] text-[#319247]"
    : normalized === "canceled" || normalized === "refunded" || normalized === "chargeback"
      ? "bg-[rgba(217,83,79,0.12)] text-[#d9534f]"
      : "bg-[rgba(211,122,22,0.12)] text-[#d37a16]";

  return (
    <span className={`inline-flex rounded-[999px] px-4 py-2 text-sm font-semibold ${className}`}>
      {label || "Não informado"}
    </span>
  );
}

export function SaleDetailView({ data, activeTab }: SaleDetailViewProps) {
  const { sale } = data;

  return (
    <DashboardShell company={data.company} pageTitle="Vendas">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard/vendas"
              className="theme-link inline-flex items-center gap-2 text-sm font-medium transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para vendas
            </Link>
            <h2 className="theme-title mt-3 text-3xl font-semibold tracking-[-0.06em]">
              {sale.code}
            </h2>
            <p className="theme-text-muted mt-2 text-sm">
              Detalhamento da venda sincronizada com a Guru.
            </p>
          </div>

          <StatusPill label={sale.statusLabel} code={sale.statusCode} />
        </div>

        <div className="theme-shell-surface rounded-[22px] border border-[var(--app-border-soft)] px-4 py-3 sm:px-6">
          <div className="flex flex-wrap gap-2 sm:gap-5">
            {TAB_ITEMS.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <Link
                  key={tab.key}
                  href={buildSaleTabHref(sale.id, tab.key)}
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
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <div className="mb-3 h-[2px] w-10 rounded-full bg-[var(--brand)]" />
                  <h3 className="theme-title text-[30px] font-semibold tracking-[-0.05em]">
                    Detalhe
                  </h3>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <DetailField label="Código" value={sale.code} />
                <DetailField label="Moeda" value={sale.currency} />
                <DetailField label="Status" value={sale.statusLabel} />
                <DetailField label="Criada em" value={sale.createdAt} />
                <DetailField label="Aprovada em" value={sale.approvedAt} />
                <DetailField label="Cancelada em" value={sale.canceledAt} />
                <div className="md:col-span-3">
                  <DetailField label="Motivo" value={sale.reason} />
                </div>
              </div>
            </section>

            <section className="theme-card rounded-[24px] p-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <div className="mb-3 h-[2px] w-10 rounded-full bg-[var(--brand)]" />
                  <h3 className="theme-title text-[30px] font-semibold tracking-[-0.05em]">
                    Pagamento
                  </h3>
                </div>

                <div className="theme-accent-soft inline-flex items-center gap-2 rounded-[12px] px-4 py-2 text-sm font-medium">
                  {getPaymentIcon(sale.paymentMethod)}
                  {sale.paymentMethodLabel || "Pagamento não informado"}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <DetailField label="Forma de pagamento" value={sale.paymentMethodLabel} />
                <DetailField label="Parcelas" value={sale.installmentsLabel} />
                <DetailField label="Produto" value={sale.productAmountLabel} />
                <DetailField label="Frete" value={sale.shippingFeeLabel} />
                <DetailField label="Desconto" value={sale.discountValueLabel} />
                <DetailField label="Imposto" value={sale.taxValueLabel} />
                <DetailField label="Afiliados" value={sale.affiliateValueLabel} />
                <DetailField label="Marketplace" value={sale.marketplaceValueLabel} />
                <DetailField label="Total" value={sale.totalLabel} />
                <DetailField label="Líquido" value={sale.netLabel} />
                <DetailField label="Checkout" value={sale.checkoutUrl} />
              </div>
            </section>

            <section className="theme-card rounded-[24px] p-6">
              <div className="mb-6">
                <div className="mb-3 h-[2px] w-10 rounded-full bg-[var(--brand)]" />
                <h3 className="theme-title text-[30px] font-semibold tracking-[-0.05em]">
                  Produto
                </h3>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <DetailField label="Unitário" value={sale.product.unitValueLabel} />
                <DetailField label="Quantidade" value={sale.product.quantity} />
                <DetailField label="Total" value={sale.product.totalValueLabel} />
                <DetailField label="Nome" value={sale.product.name} />
                <DetailField label="Oferta" value={sale.product.offerName} />
                <DetailField label="Marketplace" value={sale.product.marketplaceName} />
                <DetailField label="Marketplace ID" value={sale.product.marketplaceId} />
                <DetailField label="Produtor" value={sale.product.producerName} />
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "buyer" ? (
          <div className="space-y-6">
            <section className="theme-card rounded-[24px] p-6">
              <div className="mb-6">
                <div className="mb-3 h-[2px] w-10 rounded-full bg-[var(--brand)]" />
                <h3 className="theme-title text-[30px] font-semibold tracking-[-0.05em]">
                  Comprador
                </h3>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <DetailField label="Nome" value={sale.buyer.name} />
                <DetailField label="Email" value={sale.buyer.email} />
                <DetailField label="Celular" value={sale.buyer.phone} />
                <DetailField label="Documento" value={sale.buyer.document} />
              </div>
            </section>

            <section className="theme-card rounded-[24px] p-6">
              <div className="mb-6">
                <div className="mb-3 h-[2px] w-10 rounded-full bg-[var(--brand)]" />
                <h3 className="theme-title text-[30px] font-semibold tracking-[-0.05em]">
                  Endereço
                </h3>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <DetailField label="País" value={sale.buyer.country} />
                <DetailField label="Rua" value={sale.buyer.street} />
                <DetailField label="Número" value={sale.buyer.number} />
                <DetailField label="Complemento" value={sale.buyer.complement} />
                <DetailField label="Bairro" value={sale.buyer.district} />
                <DetailField label="Cidade" value={sale.buyer.city} />
                <DetailField label="Estado" value={sale.buyer.state} />
                <DetailField label="CEP" value={sale.buyer.zipcode} />
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "extras" ? (
          <section className="theme-card rounded-[24px] p-6">
            <div className="mb-6">
              <div className="mb-3 h-[2px] w-10 rounded-full bg-[var(--brand)]" />
              <h3 className="theme-title text-[30px] font-semibold tracking-[-0.05em]">
                Extras
              </h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <DetailField label="Source" value={sale.extras.source} />
              <DetailField label="Checkout source" value={sale.extras.checkoutSource} />
              <DetailField label="UTM source" value={sale.extras.utmSource} />
              <DetailField label="UTM campaign" value={sale.extras.utmCampaign} />
              <DetailField label="UTM medium" value={sale.extras.utmMedium} />
              <DetailField label="UTM content" value={sale.extras.utmContent} />
              <DetailField label="UTM term" value={sale.extras.utmTerm} />
              <DetailField label="IP" value={sale.extras.ip} />
              <DetailField label="País" value={sale.extras.country} />
              <DetailField label="Região" value={sale.extras.region} />
              <DetailField label="Cidade" value={sale.extras.city} />
              <DetailField label="Latitude & Longitude" value={sale.extras.latitudeLongitude} />
              <DetailField label="Termos aceitos" value={sale.extras.acceptedTerms} />
              <DetailField label="Política de privacidade" value={sale.extras.acceptedPrivacyPolicy} />
              <div className="md:col-span-2">
                <DetailField label="User Agent" value={sale.extras.userAgent} />
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "comments" ? (
          <EmptyPanel
            title="Comentários"
            description="A base da visualização já está pronta. Assim que o fluxo operacional for definido, vamos ligar comentários administrativos por venda."
          />
        ) : null}

        {activeTab === "audit" ? (
          <EmptyPanel
            title="Auditoria"
            description="A estrutura de auditoria da venda fica reservada para a próxima etapa. Aqui vamos mostrar alterações, tentativas de reenvio e eventos administrativos."
          />
        ) : null}
      </div>
    </DashboardShell>
  );
}
