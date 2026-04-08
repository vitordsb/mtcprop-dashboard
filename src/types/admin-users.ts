import type { CompanySnapshot } from "@/types/dashboard";

export type AdminAccessItem = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "SUPPORT" | "ANALYST";
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminUsersOverview = {
  company: CompanySnapshot;
  admins: AdminAccessItem[];
  summary: {
    total: number;
    active: number;
    inactive: number;
    owners: number;
  };
};
