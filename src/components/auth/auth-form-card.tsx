"use client";

import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { MtcpropMark } from "@/components/brand/mtcprop-mark";

type AuthMode = "login" | "register";

type AuthFormCardProps = {
  mode: AuthMode;
};

type LoginValues = {
  email: string;
  password: string;
};

const baseFieldClassName =
  "theme-input w-full rounded-[12px] border px-4 py-3.5 text-[15px] outline-none transition focus:border-[#45e15f] focus:ring-4 focus:ring-[rgba(69,225,95,0.14)]";

export function AuthFormCard({ mode }: AuthFormCardProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loginValues, setLoginValues] = useState<LoginValues>({
    email: "",
    password: "",
  });

  const isLogin = mode === "login";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isLogin) {
      setError(
        "O cadastro de novos administradores segue bloqueado nesta fase do projeto.",
      );
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginValues),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: {
              message?: string;
            };
          }
        | null;

      if (!response.ok) {
        setError(payload?.error?.message ?? "Credenciais invalidas.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Nao foi possivel validar seu acesso agora. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="theme-auth-card reveal rounded-[16px] border p-6 backdrop-blur-xl sm:p-8">
      <div className="mb-8 space-y-5 text-center">
        <div className="inline-flex rounded-[10px] border border-[rgba(69,225,95,0.2)] bg-[rgba(69,225,95,0.08)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#176124]">
          Ambiente interno da MTCprop
        </div>

        <MtcpropMark />

        <div className="space-y-2">
          <h1 className="theme-title text-3xl font-semibold tracking-[-0.05em]">
            {isLogin ? "Login" : "Acesso interno"}
          </h1>
          <p className="theme-text-muted mx-auto max-w-md text-sm leading-6">
            {isLogin
              ? "Entre no painel interno para acompanhar alunos, inscricoes e acessos da operacao."
              : "Novos acessos administrativos sao liberados apenas pela operacao da MTCprop."}
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            className="theme-text block text-sm font-medium"
            htmlFor="email"
          >
            E-mail de acesso
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={loginValues.email}
            onChange={(event) =>
              setLoginValues((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            className={baseFieldClassName}
            placeholder="voce@mtcprop.com.br"
          />
        </div>

        <div className="space-y-2">
          <label
            className="theme-text block text-sm font-medium"
            htmlFor="password"
          >
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={loginValues.password}
              onChange={(event) =>
                setLoginValues((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              className={`${baseFieldClassName} pr-12`}
              placeholder="Digite sua senha"
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
        </div>

        {error ? (
          <p className="rounded-[12px] border border-[rgba(255,123,123,0.24)] bg-[rgba(255,123,123,0.08)] px-4 py-3 text-sm text-[#a73d3d]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#071108] px-5 py-3.5 text-base font-semibold text-white transition hover:bg-[#0f1d12] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Entrando..." : "Entrar no painel"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="theme-text-muted mt-6 flex items-center justify-between gap-4 text-sm">
        <a
          href="mailto:suporte@mtcprop.com.br?subject=Recuperacao%20de%20acesso%20MTCprop"
          className="transition hover:text-[#071108]"
        >
          Esqueci minha senha
        </a>
        <span className="text-right leading-5 text-[#7a8a7c]">
          Novos acessos sao liberados internamente.
        </span>
      </div>
    </div>
  );
}
