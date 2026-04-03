import type { AdminUser, UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

const authenticatedAdminSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
} as const;

export type AuthenticatedAdminUser = Pick<
  AdminUser,
  "id" | "name" | "email" | "role" | "isActive" | "lastLoginAt"
>;

const getCurrentAdminUserCached = cache(async () => {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await verifySessionToken(sessionToken);

  if (!session?.sub) {
    return null;
  }

  const adminUser = await prisma.adminUser.findUnique({
    where: { id: session.sub },
    select: authenticatedAdminSelect,
  });

  if (!adminUser?.isActive) {
    return null;
  }

  if (adminUser.email !== session.email || adminUser.role !== session.role) {
    return null;
  }

  return adminUser;
});

export async function getCurrentAdminUser() {
  return getCurrentAdminUserCached();
}

export async function requireCurrentAdminUser() {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser) {
    redirect("/login");
  }

  return adminUser;
}

export async function requireRole(...roles: UserRole[]) {
  const adminUser = await requireCurrentAdminUser();

  if (!roles.includes(adminUser.role)) {
    redirect("/dashboard");
  }

  return adminUser;
}

export function getAdminInitial(adminUser: AuthenticatedAdminUser) {
  return (
    adminUser.name.trim().charAt(0) ||
    adminUser.email.trim().charAt(0) ||
    "A"
  ).toUpperCase();
}
