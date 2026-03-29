import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthShell } from "@/components/auth/auth-shell";

export default function RegisterPage() {
  return (
    <AuthShell>
      <AuthFormCard mode="register" />
    </AuthShell>
  );
}
