import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  CircleDashed,
  CreditCard,
  ExternalLink,
  Mail,
  Landmark,
  MessageCircle,
  RefreshCcw,
  Receipt,
  QrCode,
  ReceiptText,
  WalletCards,
  Wallet,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/app-shell";
import {
  getSemanticStatusBadgeClass,
  getSemanticStatusTone,
} from "@/components/dashboard/status-badge";
import type { SaleDetailOverview, SaleDetailTab } from "@/types/sales";

type SaleDetailViewProps = {
  data: SaleDetailOverview;
  activeTab: SaleDetailTab;
};

const TAB_ITEMS: Array<{ key: SaleDetailTab; label: string }> = [
  { key: "detail", label: "Detalhe" },
  { key: "buyer", label: "Comprador" },
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

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <div className="mb-3 h-[2px] w-10 rounded-full bg-[var(--brand)]" />
        <h3 className="theme-title text-[22px] font-semibold tracking-[-0.05em]">
          {title}
        </h3>
      </div>
      {action}
    </div>
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

function extractPhoneDigits(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, "");
  return digits || null;
}

function buildWhatsAppHref(value: string | null | undefined) {
  const digits = extractPhoneDigits(value);

  if (!digits) {
    return null;
  }

  const normalized = digits.length === 11 || digits.length === 10 ? `55${digits}` : digits;
  return `https://wa.me/${normalized}`;
}

function StatusPill({
  label,
  code,
}: {
  label: string | null;
  code: string | null;
}) {
  const tone = getSemanticStatusTone(code ?? label);
  const Icon = tone === "success" ? BadgeCheck : tone === "danger" ? XCircle : CircleDashed;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-[999px] border px-4 py-2 text-sm font-semibold ${getSemanticStatusBadgeClass(
        code ?? label,
      )}`}
    >
      <Icon className="h-4 w-4" />
      {label || "Não informado"}
    </span>
  );
}

function IconActionLink({
  href,
  label,
  icon,
}: {
  href: string | null;
  label: string;
  icon: ReactNode;
}) {
  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="theme-icon-button flex h-10 w-10 items-center justify-center rounded-[12px] transition"
    >
      {icon}
    </a>
  );
}

function HeaderAction({
  label,
  icon,
}: {
  label: string;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      className="theme-text-subtle inline-flex items-center gap-2 rounded-[12px] border border-[var(--app-border-soft)] bg-[var(--app-surface)] px-3 py-2 text-sm font-medium transition hover:bg-[var(--app-hover)]"
    >
      {icon}
      {label}
    </button>
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

          {activeTab === "detail" ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <HeaderAction label="Atualizar status" icon={<RefreshCcw className="h-4 w-4" />} />
              <HeaderAction label="Reenviar" icon={<RefreshCcw className="h-4 w-4" />} />
              <HeaderAction label="Informar nota fiscal" icon={<Receipt className="h-4 w-4" />} />
              {sale.refundAvailable ? (
                <HeaderAction label="Reembolsar" icon={<Wallet className="h-4 w-4" />} />
              ) : null}
              {sale.chargebackAvailable ? (
                <HeaderAction label="Marcar como chargeback" icon={<Ban className="h-4 w-4" />} />
              ) : null}
            </div>
          ) : null}
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
              <SectionTitle
                title="Detalhe"
                action={<StatusPill label={sale.statusLabel} code={sale.statusCode} />}
              />

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
              <SectionTitle
                title="Pagamento"
                action={
                  <div
                    title={sale.paymentMethodLabel || "Pagamento não informado"}
                    className="theme-accent-soft inline-flex items-center gap-2 rounded-[12px] px-4 py-2 text-sm font-medium"
                  >
                    {getPaymentIcon(sale.paymentMethod)}
                    {sale.paymentMethodLabel || "Pagamento não informado"}
                  </div>
                }
              />

              <div className="grid gap-6 md:grid-cols-3">
                <DetailField label="Forma de pagamento" value={sale.paymentMethodLabel} />
                <DetailField label="Parcelas" value={sale.installmentsLabel} />
                <DetailField label="Produto" value={sale.productAmountLabel} />
                <DetailField label="Parcelamento" value={sale.installmentInterestLabel} />
                <DetailField label="Frete" value={sale.shippingFeeLabel} />
                <DetailField label="Desconto" value={sale.discountValueLabel} />
                <DetailField label="Imposto" value={sale.taxValueLabel} />
                <DetailField label="Afiliados" value={sale.affiliateValueLabel} />
                <DetailField label="Marketplace" value={sale.marketplaceValueLabel} />
                <DetailField label="Total" value={sale.totalLabel} />
                <DetailField label="Líquido" value={sale.netLabel} />
              </div>
            </section>

            <section className="theme-card rounded-[24px] p-6">
              <SectionTitle title="Produto" />

              <div className="grid gap-6 md:grid-cols-3">
                <DetailField label="Unitário" value={sale.product.unitValueLabel} />
                <DetailField label="Quantidade" value={sale.product.quantity} />
                <DetailField label="Total" value={sale.product.totalValueLabel} />
                <DetailField label="Nome" value={sale.product.name} />
                <DetailField label="Oferta" value={sale.product.offerName} />
                <DetailField label="Marketplace" value={sale.product.marketplaceName} />
                <DetailField label="Marketplace ID" value={sale.product.marketplaceId} />
                <DetailField label="Produtor" value={sale.product.producerName} />
                <DetailField label="Checkout" value={sale.checkoutUrl} />
                <DetailField label="Nota fiscal" value={sale.invoiceActionLabel} />
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "buyer" ? (
          <div className="space-y-6">
            <section className="theme-card rounded-[24px] p-6">
              <SectionTitle
                title="Comprador"
                action={
                  <button
                    type="button"
                    className="theme-text-subtle inline-flex items-center gap-2 rounded-[12px] border border-[var(--app-border-soft)] bg-[var(--app-surface)] px-3 py-2 text-sm font-medium transition hover:bg-[var(--app-hover)]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Editar comprador
                  </button>
                }
              />

              <div className="mb-6 flex flex-wrap items-center gap-2">
                <IconActionLink
                  href={sale.buyer.email ? `mailto:${sale.buyer.email}` : null}
                  label="Enviar email"
                  icon={<Mail className="h-4 w-4" />}
                />
                <IconActionLink
                  href={buildWhatsAppHref(sale.buyer.phone)}
                  label="Abrir WhatsApp"
                  icon={<MessageCircle className="h-4 w-4" />}
                />
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

            <section className="theme-card rounded-[24px] p-6">
              <SectionTitle title="Infraestrutura" />

              <div className="grid gap-6 md:grid-cols-2">
                <DetailField label="País" value={sale.extras.country} />
                <DetailField label="Região" value={sale.extras.region} />
                <DetailField label="Cidade" value={sale.extras.city} />
                <DetailField label="Latitude & Longitude" value={sale.extras.latitudeLongitude} />
                <DetailField label="IP" value={sale.extras.ip} />
                <DetailField label="User Agent" value={sale.extras.userAgent} />
              </div>
            </section>
          </div>
        ) : null}

      </div>
    </DashboardShell>
  );
}
