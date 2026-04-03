import type { CompanySnapshot, StudentStage } from "@/types/dashboard";

export type TraderWorkbookOrigin = "Challenge" | "Fast" | "Conta real";

export type TraderListItem = {
  id: string;
  name: string;
  email: string;
  plan: string;
  stage: StudentStage;
  origin: TraderWorkbookOrigin;
  startedAt: string;
  accessActive: number;
  accessPending: number;
  historyCount: number;
  nextMonthlyDue: string;
  restartUsed: boolean;
  sourceSheets: string[];
};

export type TradersPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type TradersOverview = {
  company: CompanySnapshot;
  traders: TraderListItem[];
  pagination: TradersPagination;
};
