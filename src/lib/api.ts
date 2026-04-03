import { dashboardService } from "@/lib/services/dashboard-service";
import { tradersService } from "@/lib/services/traders-service";
import type { DashboardOverview } from "@/types/dashboard";
import type { TradersOverview } from "@/types/traders";

// Server Components chamam os services diretamente — sem round trip HTTP.
// Client Components que precisarem de dados devem usar os Route Handlers em /api/.

export async function getDashboardOverview(): Promise<DashboardOverview> {
  return dashboardService.getOverview();
}

export async function getTradersOverview(params?: {
  page?: number | string | null;
  limit?: number | string | null;
}): Promise<TradersOverview> {
  return tradersService.getOverview(params);
}
