import { redirect } from "next/navigation";

import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentAdminUser } from "@/lib/auth/server";

export default async function LoginPage() {
  const adminUser = await getCurrentAdminUser();

  if (adminUser) {
    redirect("/dashboard");
  }

  return (
    <AuthShell>
      <AuthFormCard mode="login" />
    </AuthShell>
  );
}
