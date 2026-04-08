"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { MtcpropMark } from "@/components/brand/mtcprop-mark";

const baseFieldClassName =
  "theme-input w-full rounded-[12px] border px-4 py-3.5 text-[15px] outline-none transition focus:border-[#45e15f] focus:ring-4 focus:ring-[rgba(69,225,95,0.14)]";

export function PasswordResetConfirmCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const missingToken = token.length === 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (missingToken) {
      setError("O link de redefinicao esta incompleto. Solicite um novo.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: {
              message?: string;
            };
          }
        | null;

      if (!response.ok) {
        setError(
          payload?.error?.message ??
            "Nao foi possivel redefinir sua senha agora.",
        );
        return;
      }

      setSuccess(true);
      router.replace("/login?reset=success");
      router.refresh();
    } catch {
      setError("Nao foi possivel redefinir sua senha agora.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="theme-auth-card reveal rounded-[16px] border p-6 backdrop-blur-xl sm:p-8">
      <div className="mb-8 space-y-5 text-center">
        <div className="theme-accent-soft inline-flex rounded-[10px] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em]">
          Criar nova senha
        </div>

        <MtcpropMark />

        <div className="space-y-2">
          <h1 className="theme-title text-3xl font-semibold tracking-[-0.05em]">
            Nova senha
          </h1>
          <p className="theme-text-muted mx-auto max-w-md text-sm leading-6">
            Defina uma nova senha forte para continuar acessando o painel
            interno da MTCprop.
          </p>
        </div>
      </div>

      {success ? (
        <div className="space-y-5">
          <div className="theme-accent-soft rounded-[12px] px-4 py-4 text-sm leading-6">
            Senha atualizada com sucesso. Redirecionando voce para o login.
          </div>
          <Link
            href="/login?reset=success"
            className="theme-text flex items-center justify-center gap-2 rounded-[12px] border border-[var(--app-border)] px-4 py-3 text-sm font-semibold transition hover:bg-[var(--app-hover)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Ir para o login
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              className="theme-text block text-sm font-medium"
              htmlFor="new-password"
            >
              Nova senha
            </label>
            <div className="relative">
              <LockKeyhole className="theme-text-subtle pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`${baseFieldClassName} pl-11 pr-12`}
                placeholder="Use uma senha forte"
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPassword((current) => !current)}
                className="theme-icon-button absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[10px] transition"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="theme-text-subtle text-xs leading-5">
              Use pelo menos 14 caracteres com letras maiusculas, minusculas,
              numeros e caractere especial.
            </p>
          </div>

          <div className="space-y-2">
            <label
              className="theme-text block text-sm font-medium"
              htmlFor="confirm-password"
            >
              Confirmar nova senha
            </label>
            <div className="relative">
              <LockKeyhole className="theme-text-subtle pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={`${baseFieldClassName} pl-11 pr-12`}
                placeholder="Repita a nova senha"
              />
              <button
                type="button"
                aria-label={
                  showConfirmPassword ? "Ocultar senha" : "Mostrar senha"
                }
                onClick={() =>
                  setShowConfirmPassword((current) => !current)
                }
                className="theme-icon-button absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[10px] transition"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {missingToken ? (
            <p className="theme-danger-box rounded-[12px] px-4 py-3 text-sm">
              O link de redefinicao nao foi encontrado. Solicite um novo.
            </p>
          ) : null}

          {error ? (
            <p className="theme-danger-box rounded-[12px] px-4 py-3 text-sm">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending || missingToken}
            className="theme-button-primary mt-2 flex w-full items-center justify-center gap-2 rounded-[12px] px-5 py-3.5 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Atualizando senha..." : "Salvar nova senha"}
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="theme-text-muted flex items-center justify-between gap-4 text-sm">
            <Link href="/recuperar-senha" className="theme-link transition">
              Solicitar novo link
            </Link>
            <span className="theme-text-subtle text-right leading-5">
              O link e invalido automaticamente apos o uso.
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
