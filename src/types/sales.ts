import type { CompanySnapshot } from "@/types/dashboard";

export type SalesPeriodPreset =
  | "today"
  | "week"
  | "month"
  | "six-months"
  | "year"
  | "custom";
export type SaleDetailTab = "detail" | "buyer" | "extras" | "comments" | "audit";

export type SaleRecord = {
  id: string;
  code: string;
  contactName: string;
  contactEmail: string | null;
  productName: string;
  amountLabel: string;
  amount: number | null;
  createdAt: string | null;
  statusCode: string | null;
  statusLabel: string | null;
  paymentMethod: string | null;
  paymentMethodLabel: string | null;
};

export type SalesOverview = {
  company: CompanySnapshot;
  sales: SaleRecord[];
  defaultPageSize: number;
  guruConfigured: boolean;
  period: SalesPeriodPreset;
  dateFrom: string;
  dateTo: string;
  periodLabel: string;
  availableStatuses: string[];
};

export type SaleDetailOverview = {
  company: CompanySnapshot;
  sale: {
    id: string;
    code: string;
    statusCode: string | null;
    statusLabel: string | null;
    currency: string | null;
    createdAt: string | null;
    approvedAt: string | null;
    canceledAt: string | null;
    reason: string | null;
    paymentMethod: string | null;
    paymentMethodLabel: string | null;
    installmentsLabel: string | null;
    installmentInterestLabel: string;
    productAmountLabel: string;
    shippingFeeLabel: string;
    discountValueLabel: string;
    taxValueLabel: string;
    affiliateValueLabel: string;
    marketplaceValueLabel: string;
    totalLabel: string;
    netLabel: string;
    checkoutUrl: string | null;
    invoiceActionLabel: string | null;
    refundAvailable: boolean;
    chargebackAvailable: boolean;
    buyer: {
      name: string;
      email: string | null;
      document: string | null;
      phone: string | null;
      country: string | null;
      street: string | null;
      number: string | null;
      complement: string | null;
      district: string | null;
      city: string | null;
      state: string | null;
      zipcode: string | null;
    };
    product: {
      unitValueLabel: string;
      quantity: string;
      totalValueLabel: string;
      name: string;
      offerName: string | null;
      marketplaceName: string | null;
      marketplaceId: string | null;
      producerName: string | null;
    };
    extras: {
      source: string | null;
      checkoutSource: string | null;
      utmSource: string | null;
      utmCampaign: string | null;
      utmMedium: string | null;
      utmContent: string | null;
      utmTerm: string | null;
      ip: string | null;
      country: string | null;
      region: string | null;
      city: string | null;
      latitudeLongitude: string | null;
      userAgent: string | null;
      acceptedTerms: string | null;
      acceptedPrivacyPolicy: string | null;
    };
  };
};
