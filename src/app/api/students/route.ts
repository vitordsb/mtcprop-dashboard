import { getCurrentAdminUser } from "@/lib/auth/server";
import { errorResponse, paginatedResponse } from "@/lib/http";
import { tradersService } from "@/lib/services/traders-service";

export async function GET(request: Request) {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser) {
    return errorResponse(401, "UNAUTHORIZED", "Sessao invalida ou expirada.");
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");

  const result = await tradersService.getOverview({ page, limit });

  return paginatedResponse(result.traders, result.pagination);
}
