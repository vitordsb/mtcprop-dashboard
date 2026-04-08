"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { useState } from "react";

import { MtcpropMark } from "@/components/brand/mtcprop-mark";

const baseFieldClassName =
  "theme-input w-full rounded-[12px] border px-4 py-3.5 text-[15px] outline-none transition focus:border-[#45e15f] focus:ring-4 focus:ring-[rgba(69,225,95,0.14)]";

export function PasswordResetRequestCard() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
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
            "Nao foi possivel iniciar a recuperacao agora.",
        );
        return;
      }

      setSuccess(true);
    } catch {
      setError("Nao foi possivel iniciar a recuperacao agora.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="theme-auth-card reveal rounded-[16px] border p-6 backdrop-blur-xl sm:p-8">
      <div className="mb-8 space-y-5 text-center">
        <div className="theme-accent-soft inline-flex rounded-[10px] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em]">
          Recuperacao de acesso
        </div>

        <MtcpropMark />

        <div className="space-y-2">
          <h1 className="theme-title text-3xl font-semibold tracking-[-0.05em]">
            Redefinir senha
          </h1>
          <p className="theme-text-muted mx-auto max-w-md text-sm leading-6">
            Informe o e-mail do acesso administrativo para receber o link de
            redefinicao.
          </p>
        </div>
      </div>

      {success ? (
        <div className="space-y-5">
          <div className="theme-accent-soft rounded-[12px] px-4 py-4 text-sm leading-6">
            Se existir um acesso interno com esse e-mail, o link de recuperacao
            foi enviado. Verifique a caixa de entrada e o spam.
          </div>
          <Link
            href="/login"
            className="theme-text flex items-center justify-center gap-2 rounded-[12px] border border-[var(--app-border)] px-4 py-3 text-sm font-semibold transition hover:bg-[var(--app-hover)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              className="theme-text block text-sm font-medium"
              htmlFor="reset-email"
            >
              E-mail de acesso
            </label>
            <div className="relative">
              <Mail className="theme-text-subtle pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={`${baseFieldClassName} pl-11`}
                placeholder="voce@mtcprop.com.br"
              />
            </div>
          </div>

          {error ? (
            <p className="theme-danger-box rounded-[12px] px-4 py-3 text-sm">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="theme-button-primary mt-2 flex w-full items-center justify-center gap-2 rounded-[12px] px-5 py-3.5 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Enviando link..." : "Enviar link de recuperacao"}
            <Send className="h-4 w-4" />
          </button>

          <div className="theme-text-muted flex items-center justify-between gap-4 text-sm">
            <Link href="/login" className="theme-link transition">
              Voltar ao login
            </Link>
            <span className="theme-text-subtle text-right leading-5">
              O link expira automaticamente em poucas horas.
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
