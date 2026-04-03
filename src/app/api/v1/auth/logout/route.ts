import { getCurrentAdminUser } from "@/lib/auth/server";
import { clearSessionCookie } from "@/lib/auth/session";
import { successResponse } from "@/lib/http";
import { authService } from "@/lib/services/auth-service";

export async function POST() {
  const adminUser = await getCurrentAdminUser();

  if (adminUser) {
    await authService.recordLogout(adminUser.id);
  }

  const response = successResponse({ success: true });
  clearSessionCookie(response);
  return response;
}
