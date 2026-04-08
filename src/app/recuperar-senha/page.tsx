import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordResetRequestCard } from "@/components/auth/password-reset-request-card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <PasswordResetRequestCard />
    </AuthShell>
  );
}
