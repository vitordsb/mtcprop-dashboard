"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { startTransition, useState } from "react";

import { MtcpropMark } from "@/components/brand/mtcprop-mark";

type AuthMode = "login" | "register";

type AuthFormCardProps = {
  mode: AuthMode;
};

type LoginValues = {
  email: string;
  password: string;
};

type RegisterValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const baseFieldClassName =
  "w-full rounded-[12px] border border-[#d8e2d9] bg-[#fcfdfc] px-4 py-3.5 text-[15px] text-[#071108] outline-none transition placeholder:text-[#8a9a8d] focus:border-[#45e15f] focus:ring-4 focus:ring-[rgba(69,225,95,0.14)]";

export function AuthFormCard({ mode }: AuthFormCardProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loginValues, setLoginValues] = useState<LoginValues>({
    email: "",
    password: "",
  });
  const [registerValues, setRegisterValues] = useState<RegisterValues>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const isLogin = mode === "login";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isLogin && registerValues.password !== registerValues.confirmPassword) {
      setError("As senhas precisam ser iguais para concluir o primeiro acesso.");
      return;
    }

    setPending(true);

    startTransition(() => {
      router.push("/dashboard");
      setPending(false);
    });
  }

  return (
    <div className="reveal rounded-[16px] border border-[rgba(7,17,8,0.08)] bg-white/92 p-6 shadow-[0_28px_80px_rgba(7,17,8,0.12)] backdrop-blur-xl sm:p-8">
      <div className="mb-8 space-y-5 text-center">
        <div className="inline-flex rounded-[10px] border border-[rgba(69,225,95,0.2)] bg-[rgba(69,225,95,0.08)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#176124]">
          Ambiente interno da MTCprop
        </div>

        <MtcpropMark />

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-[-0.05em] text-[#071108]">
            {isLogin ? "Login" : "Primeiro acesso"}
          </h1>
          <p className="mx-auto max-w-md text-sm leading-6 text-[#607162]">
            {isLogin
              ? "Entre no painel interno para acompanhar alunos, inscricoes e acessos da operacao."
              : "Crie seu acesso administrativo inicial para entrar no painel e organizar a operacao."}
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {!isLogin ? (
          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-[#415243]"
              htmlFor="name"
            >
              Nome completo
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={registerValues.name}
              onChange={(event) =>
                setRegisterValues((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              className={baseFieldClassName}
              placeholder="Seu nome completo"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-[#415243]"
            htmlFor="email"
          >
            E-mail de acesso
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={isLogin ? loginValues.email : registerValues.email}
            onChange={(event) => {
              const value = event.target.value;

              if (isLogin) {
                setLoginValues((current) => ({ ...current, email: value }));
                return;
              }

              setRegisterValues((current) => ({ ...current, email: value }));
            }}
            className={baseFieldClassName}
            placeholder="voce@mtcprop.com.br"
          />
        </div>

        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-[#415243]"
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
              value={isLogin ? loginValues.password : registerValues.password}
              onChange={(event) => {
                const value = event.target.value;

                if (isLogin) {
                  setLoginValues((current) => ({ ...current, password: value }));
                  return;
                }

                setRegisterValues((current) => ({ ...current, password: value }));
              }}
              className={`${baseFieldClassName} pr-12`}
              placeholder="Digite sua senha"
            />
            <button
              type="button"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[10px] text-[#7b8b7d] transition hover:bg-[#eff4ef] hover:text-[#071108]"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {!isLogin ? (
          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-[#415243]"
              htmlFor="confirmPassword"
            >
              Confirmar senha
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={registerValues.confirmPassword}
                onChange={(event) =>
                setRegisterValues((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
                className={`${baseFieldClassName} pr-12`}
                placeholder="Repita sua senha"
              />
              <button
                type="button"
                aria-label={
                  showConfirmPassword ? "Ocultar confirmacao" : "Mostrar confirmacao"
                }
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[10px] text-[#7b8b7d] transition hover:bg-[#eff4ef] hover:text-[#071108]"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ) : null}

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
          {pending
            ? isLogin
              ? "Entrando..."
              : "Criando acesso..."
            : isLogin
              ? "Entrar no painel"
              : "Criar acesso"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-4 text-sm text-[#607162]">
        {isLogin ? (
          <>
            <a
              href="mailto:suporte@mtcprop.com.br?subject=Recuperacao%20de%20acesso%20MTCprop"
              className="transition hover:text-[#071108]"
            >
              Esqueci minha senha
            </a>
            <Link href="/registro" className="transition hover:text-[#071108]">
              Primeiro acesso
            </Link>
          </>
        ) : (
          <>
            <Link href="/login" className="transition hover:text-[#071108]">
              Ja tenho acesso
            </Link>
            <a
              href="mailto:suporte@mtcprop.com.br?subject=Ativacao%20de%20acesso%20MTCprop"
              className="transition hover:text-[#071108]"
            >
              Preciso de suporte
            </a>
          </>
        )}
      </div>
    </div>
  );
}
