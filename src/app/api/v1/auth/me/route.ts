import { getCurrentAdminUser } from "@/lib/auth/server";
import { errorResponse, successResponse } from "@/lib/http";

export async function GET() {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser) {
    return errorResponse(401, "UNAUTHORIZED", "Sessao invalida ou expirada.");
  }

  return successResponse(adminUser);
}
