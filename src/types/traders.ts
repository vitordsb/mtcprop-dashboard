import type { CompanySnapshot } from "@/types/dashboard";

export type TraderListItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  city: string | null;
  state: string | null;
  country: string | null;
  regionLabel: string | null;
  createdAt: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  zipcode: string | null;
};

export type TradersOverview = {
  company: CompanySnapshot;
  traders: TraderListItem[];
  defaultPageSize: number;
  guruConfigured: boolean;
  guruContactsAdminUrl: string;
};

export type TraderProfileTab =
  | "detail"
  | "sales"
  | "etickets"
  | "comments"
  | "audit";

export type TraderSaleRecord = {
  id: string;
  code: string;
  productName: string;
  createdAt: string | null;
  amountLabel: string;
  statusLabel: string | null;
};

export type TraderEticketRecord = {
  id: string;
  code: string;
  createdAt: string | null;
  productName: string;
  participantName: string;
  email: string;
  phone: string;
};

export type TraderProfileOverview = {
  company: CompanySnapshot;
  trader: TraderListItem;
  sales: TraderSaleRecord[];
  etickets: TraderEticketRecord[];
  commentsCount: number;
  auditCount: number;
};
