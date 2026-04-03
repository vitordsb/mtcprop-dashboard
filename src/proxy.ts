import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session";

const AUTH_ROUTES = new Set(["/login", "/registro"]);

export async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionToken
    ? await verifySessionToken(sessionToken)
    : null;
  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(session?.sub);
  const isAuthRoute = AUTH_ROUTES.has(pathname);
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (pathname === "/registro") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isDashboardRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/registro", "/dashboard/:path*"],
};
