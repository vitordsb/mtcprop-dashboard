import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordResetConfirmCard } from "@/components/auth/password-reset-confirm-card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function NewPasswordPage() {
  return (
    <AuthShell>
      <PasswordResetConfirmCard />
    </AuthShell>
  );
}
