import { dashboardService } from "@/lib/services/dashboard-service";
import { saleDetailService } from "@/lib/services/sale-detail-service";
import { salesService } from "@/lib/services/sales-service";
import { tradersService } from "@/lib/services/traders-service";
import { traderProfileService } from "@/lib/services/trader-profile-service";
import { adminUsersService } from "@/lib/services/admin-users-service";
import { requireCurrentAdminUser } from "@/lib/auth/server";
import type { AdminUsersOverview } from "@/types/admin-users";
import type { DashboardOverview } from "@/types/dashboard";
import type { SaleDetailOverview, SalesOverview } from "@/types/sales";
import type { TraderProfileOverview, TradersOverview } from "@/types/traders";

// Server Components chamam os services diretamente — sem round trip HTTP.
// Client Components que precisarem de dados devem usar os Route Handlers em /api/.

export async function getDashboardOverview(): Promise<DashboardOverview> {
  await requireCurrentAdminUser();
  return dashboardService.getOverview();
}

export async function getTradersOverview(): Promise<TradersOverview> {
  await requireCurrentAdminUser();
  return tradersService.getOverview();
}

export async function getSalesOverview(params?: {
  period?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}): Promise<SalesOverview> {
  await requireCurrentAdminUser();
  return salesService.getOverview(params);
}

export async function getTraderProfileOverview(
  traderId: string,
): Promise<TraderProfileOverview | null> {
  await requireCurrentAdminUser();
  return traderProfileService.getOverview(traderId);
}

export async function getSaleDetailOverview(
  saleId: string,
): Promise<SaleDetailOverview | null> {
  await requireCurrentAdminUser();
  return saleDetailService.getOverview(saleId);
}

export async function getActivePlansOverview(params?: {
  page?: number | string | null;
  limit?: number | string | null;
  q?: string | null;
}) {
  await requireCurrentAdminUser();
  const { plansService } = await import("@/lib/services/plans-service");
  return plansService.getActivePlans(params);
}

export async function getMensalidadesOverview(params?: {
  page?: number | string | null;
  limit?: number | string | null;
  q?: string | null;
}) {
  await requireCurrentAdminUser();
  const { mensalidadesService } = await import("@/lib/services/mensalidades-service");
  return mensalidadesService.getOverview(params);
}

export async function getSolicitacoesOverview(params?: {
  page?: number | string | null;
  limit?: number | string | null;
  q?: string | null;
  status?: string | null;
  type?: string | null;
}) {
  await requireCurrentAdminUser();
  const { solicitacoesService } = await import("@/lib/services/solicitacoes-service");
  return solicitacoesService.getOverview(params);
}

export async function getAdminUsersOverview(): Promise<AdminUsersOverview> {
  await requireCurrentAdminUser();
  return adminUsersService.getOverview();
}
