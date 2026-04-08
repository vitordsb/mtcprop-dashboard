import { redirect } from "next/navigation";

import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentAdminUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LoginPageProps = {
  searchParams?: Promise<{
    reset?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const adminUser = await getCurrentAdminUser();
  const params = searchParams ? await searchParams : undefined;

  if (adminUser) {
    redirect("/dashboard");
  }

  const notice =
    params?.reset === "success"
      ? "Senha redefinida com sucesso. Entre com a nova credencial."
      : null;

  return (
    <AuthShell>
      <AuthFormCard mode="login" notice={notice} />
    </AuthShell>
  );
}
