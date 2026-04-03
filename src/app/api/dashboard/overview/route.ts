import { getCurrentAdminUser } from "@/lib/auth/server";
import { errorResponse, successResponse } from "@/lib/http";
import { dashboardService } from "@/lib/services/dashboard-service";

export async function GET() {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser) {
    return errorResponse(401, "UNAUTHORIZED", "Sessao invalida ou expirada.");
  }

  const data = await dashboardService.getOverview();
  return successResponse(data);
}
