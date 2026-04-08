import { NextResponse } from "next/server";

import { getCurrentAdminUser } from "@/lib/auth/server";
import { clearSessionCookie } from "@/lib/auth/session";
import { successResponse } from "@/lib/http";
import { authService } from "@/lib/services/auth-service";

// GET: usado por redirecionamentos server-side para limpar cookie inválido e ir para /login
export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  clearSessionCookie(response);
  return response;
}

export async function POST() {
  const adminUser = await getCurrentAdminUser();

  if (adminUser) {
    await authService.recordLogout(adminUser.id);
  }

  const response = successResponse({ success: true });
  clearSessionCookie(response);
  return response;
}
