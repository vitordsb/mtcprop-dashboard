"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import {
  KeyRound,
  PencilLine,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { AdminAccessItem, AdminUsersOverview } from "@/types/admin-users";

type AdminUsersOverviewProps = {
  data: AdminUsersOverview;
  currentAdminUserId: string;
};

type AdminFormState = {
  name: string;
  email: string;
  password: string;
  isActive: boolean;
};

const FIELD_CLASSNAME =
  "theme-input mt-2 w-full rounded-[12px] border px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]";

const INITIAL_FORM_STATE: AdminFormState = {
  name: "",
  email: "",
  password: "",
  isActive: true,
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "Sem registro";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Sem registro";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function generateStrongPassword(length = 18) {
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const specials = "!@#$%&*()-_=+?";
  const combined = `${lowercase}${uppercase}${digits}${specials}`;

  const required = [
    lowercase[Math.floor(Math.random() * lowercase.length)],
    uppercase[Math.floor(Math.random() * uppercase.length)],
    digits[Math.floor(Math.random() * digits.length)],
    specials[Math.floor(Math.random() * specials.length)],
  ];

  const cryptoValues = new Uint32Array(Math.max(length - required.length, 0));
  globalThis.crypto.getRandomValues(cryptoValues);

  const generated = Array.from(cryptoValues, (value) => combined[value % combined.length]);
  const password = [...required, ...generated];

  for (let index = password.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [password[index], password[swapIndex]] = [password[swapIndex], password[index]];
  }

  return password.join("");
}

function RoleBadge({ role }: { role: AdminAccessItem["role"] }) {
  const isOwner = role === "OWNER";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
        isOwner
          ? "bg-[rgba(69,225,95,0.14)] text-[var(--brand)]"
          : "bg-[var(--app-surface-soft)] text-[var(--app-text-subtle)]"
      }`}
    >
      {isOwner ? "Owner" : "Administrador"}
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
        isActive
          ? "bg-[rgba(69,225,95,0.14)] text-[var(--brand)]"
          : "bg-[rgba(239,68,68,0.1)] text-[#ef4444]"
      }`}
    >
      {isActive ? "Ativo" : "Inativo"}
    </span>
  );
}

function AdminUserModal({
  isOpen,
  mode,
  initialAdmin,
  isPending,
  errorMessage,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  mode: "create" | "edit";
  initialAdmin: AdminAccessItem | null;
  isPending: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (state: AdminFormState) => void;
}) {
  const [form, setForm] = useState<AdminFormState>(() =>
    initialAdmin
      ? {
          name: initialAdmin.name,
          email: initialAdmin.email,
          password: "",
          isActive: initialAdmin.isActive,
        }
      : INITIAL_FORM_STATE,
  );

  if (!isOpen) {
    return null;
  }

  function updateField<Key extends keyof AdminFormState>(
    key: Key,
    value: AdminFormState[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(7,17,8,0.52)] px-4 py-8 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="theme-card relative z-10 w-full max-w-2xl overflow-hidden rounded-[24px]">
        <div className="theme-shell-surface flex items-center justify-between border-b border-[var(--app-border-soft)] px-6 py-5">
          <div>
            <h2 className="theme-title text-2xl font-semibold tracking-[-0.04em]">
              {mode === "create" ? "Novo acesso interno" : "Editar acesso interno"}
            </h2>
            <p className="theme-text-subtle mt-1 text-sm">
              Todos os acessos internos continuam com visibilidade completa da plataforma.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="theme-icon-button flex h-10 w-10 items-center justify-center rounded-[12px] transition"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="theme-text block text-sm font-medium">
                Nome completo *
              </label>
              <input
                className={FIELD_CLASSNAME}
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Nome completo do colaborador"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="theme-text block text-sm font-medium">
                E-mail *
              </label>
              <input
                type="email"
                className={FIELD_CLASSNAME}
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="email@mtcprop.com.br"
                required
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <label className="theme-text block text-sm font-medium">
                  {mode === "create" ? "Senha forte *" : "Nova senha"}
                </label>
                <button
                  type="button"
                  onClick={() => updateField("password", generateStrongPassword())}
                  className="theme-accent-text text-xs font-semibold uppercase tracking-[0.18em]"
                >
                  Gerar senha forte
                </button>
              </div>
              <input
                type="text"
                className={FIELD_CLASSNAME}
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder={
                  mode === "create"
                    ? "14+ caracteres com maiuscula, minuscula, numero e simbolo"
                    : "Preencha apenas se quiser trocar a senha"
                }
                required={mode === "create"}
              />
            </div>
          </div>

          {mode === "edit" ? (
            <label className="theme-card-soft flex items-center justify-between rounded-[16px] px-4 py-4">
              <div>
                <p className="theme-title font-semibold">Acesso ativo</p>
                <p className="theme-text-muted mt-1 text-sm">
                  Desative para bloquear o login desse colaborador.
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => updateField("isActive", event.target.checked)}
                className="h-5 w-5 accent-[var(--brand)]"
              />
            </label>
          ) : null}

          <div className="theme-warning-box rounded-[14px] px-4 py-3 text-sm">
            Owners e administradores internos continuam com o mesmo acesso completo por enquanto. A diferenca de permissao pode ser detalhada depois.
          </div>

          {errorMessage ? (
            <div className="rounded-[14px] border border-[rgba(239,68,68,0.18)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[#ef4444]">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-[var(--app-border-soft)] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="theme-text rounded-[12px] border border-[var(--app-border-strong)] bg-[var(--app-surface)] px-4 py-3 text-sm font-medium transition hover:bg-[var(--app-hover)]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="theme-button-primary rounded-[12px] px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending
                ? "Salvando..."
                : mode === "create"
                  ? "Criar acesso"
                  : "Salvar alteracoes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminUsersOverviewView({
  data,
  currentAdminUserId,
}: AdminUsersOverviewProps) {
  const router = useRouter();
  const [admins, setAdmins] = useState(data.admins);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedAdmin, setSelectedAdmin] = useState<AdminAccessItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const summary = useMemo(
    () => ({
      total: admins.length,
      active: admins.filter((admin) => admin.isActive).length,
      inactive: admins.filter((admin) => !admin.isActive).length,
      owners: admins.filter((admin) => admin.role === "OWNER").length,
    }),
    [admins],
  );

  function syncAdmin(nextAdmin: AdminAccessItem) {
    setAdmins((current) => {
      const exists = current.some((admin) => admin.id === nextAdmin.id);

      if (!exists) {
        return [...current, nextAdmin].sort((left, right) =>
          left.name.localeCompare(right.name, "pt-BR"),
        );
      }

      return current.map((admin) => (admin.id === nextAdmin.id ? nextAdmin : admin));
    });
  }

  function openCreateModal() {
    setModalMode("create");
    setSelectedAdmin(null);
    setErrorMessage(null);
    setFeedbackMessage(null);
    setIsModalOpen(true);
  }

  function openEditModal(admin: AdminAccessItem) {
    setModalMode("edit");
    setSelectedAdmin(admin);
    setErrorMessage(null);
    setFeedbackMessage(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isPending) return;
    setIsModalOpen(false);
  }

  async function handleSubmit(form: AdminFormState) {
    setErrorMessage(null);
    setFeedbackMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch(
          modalMode === "create"
            ? "/api/v1/admin-users"
            : `/api/v1/admin-users/${selectedAdmin?.id}`,
          {
            method: modalMode === "create" ? "POST" : "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
          },
        );

        const payload = await response.json();

        if (!response.ok) {
          setErrorMessage(
            payload?.error?.message ||
              "Nao foi possivel salvar o acesso administrativo.",
          );
          return;
        }

        syncAdmin(payload.data.adminUser as AdminAccessItem);
        setFeedbackMessage(
          modalMode === "create"
            ? "Acesso criado com sucesso."
            : "Acesso atualizado com sucesso.",
        );
        setIsModalOpen(false);
        router.refresh();
      } catch {
        setErrorMessage("Falha inesperada ao salvar o acesso administrativo.");
      }
    });
  }

  function handleRevoke(admin: AdminAccessItem) {
    const confirmed = window.confirm(
      `Deseja remover o acesso de ${admin.name}? O usuario ficara inativo no painel.`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setFeedbackMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/v1/admin-users/${admin.id}`, {
          method: "DELETE",
        });

        const payload = await response.json();

        if (!response.ok) {
          setErrorMessage(
            payload?.error?.message || "Nao foi possivel remover o acesso.",
          );
          return;
        }

        syncAdmin(payload.data.adminUser as AdminAccessItem);
        setFeedbackMessage("Acesso removido com sucesso.");
        router.refresh();
      } catch {
        setErrorMessage("Falha inesperada ao remover o acesso.");
      }
    });
  }

  return (
    <section className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="theme-card rounded-[20px] p-5">
          <div className="theme-accent-icon flex h-11 w-11 items-center justify-center rounded-[14px]">
            <UsersRound className="h-5 w-5" />
          </div>
          <p className="theme-text-subtle mt-4 text-[11px] font-semibold uppercase tracking-[0.18em]">
            Total de acessos
          </p>
          <p className="theme-title mt-2 text-2xl font-semibold">{summary.total}</p>
        </article>

        <article className="theme-card rounded-[20px] p-5">
          <div className="theme-accent-icon flex h-11 w-11 items-center justify-center rounded-[14px]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="theme-text-subtle mt-4 text-[11px] font-semibold uppercase tracking-[0.18em]">
            Ativos
          </p>
          <p className="theme-title mt-2 text-2xl font-semibold">{summary.active}</p>
        </article>

        <article className="theme-card rounded-[20px] p-5">
          <div className="theme-accent-icon flex h-11 w-11 items-center justify-center rounded-[14px]">
            <UserRound className="h-5 w-5" />
          </div>
          <p className="theme-text-subtle mt-4 text-[11px] font-semibold uppercase tracking-[0.18em]">
            Owners
          </p>
          <p className="theme-title mt-2 text-2xl font-semibold">{summary.owners}</p>
        </article>

        <article className="theme-card rounded-[20px] p-5">
          <div className="theme-accent-icon flex h-11 w-11 items-center justify-center rounded-[14px]">
            <KeyRound className="h-5 w-5" />
          </div>
          <p className="theme-text-subtle mt-4 text-[11px] font-semibold uppercase tracking-[0.18em]">
            Inativos
          </p>
          <p className="theme-title mt-2 text-2xl font-semibold">{summary.inactive}</p>
        </article>
      </section>

      <section className="theme-card overflow-hidden rounded-[24px]">
        <div className="border-b border-[var(--app-border-soft)] px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="theme-title text-2xl font-semibold tracking-[-0.04em]">
                Acessos da plataforma
              </h2>
              <p className="theme-text-subtle mt-1 text-sm">
                Crie, edite e revoke acessos internos do painel administrativo da MTCprop.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-2 text-sm font-semibold transition"
            >
              <Plus className="h-4 w-4" />
              Novo acesso
            </button>
          </div>

          <div className="theme-warning-box mt-4 rounded-[14px] px-4 py-3 text-sm">
            Por enquanto, todos os usuarios internos possuem acesso completo ao sistema. Owners seguem identificados apenas para controle do nucleo da conta.
          </div>

          {feedbackMessage ? (
            <div className="mt-4 rounded-[14px] border border-[rgba(69,225,95,0.18)] bg-[rgba(69,225,95,0.08)] px-4 py-3 text-sm text-[var(--brand)]">
              {feedbackMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-4 rounded-[14px] border border-[rgba(239,68,68,0.18)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[#ef4444]">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full">
            <thead className="theme-table-head">
              <tr className="theme-text-subtle text-left text-[11px] font-semibold uppercase tracking-[0.18em]">
                <th className="px-6 py-4">Nome</th>
                <th className="px-4 py-4">E-mail</th>
                <th className="px-4 py-4">Perfil</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Ultimo login</th>
                <th className="px-4 py-4">Criado em</th>
                <th className="px-6 py-4 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr
                  key={admin.id}
                  className="theme-table-row border-t border-[var(--app-border-soft)] text-sm"
                >
                  <td className="px-6 py-5">
                    <p className="theme-title font-semibold">{admin.name}</p>
                  </td>
                  <td className="px-4 py-5">
                    <p className="theme-text">{admin.email}</p>
                  </td>
                  <td className="px-4 py-5">
                    <RoleBadge role={admin.role} />
                  </td>
                  <td className="px-4 py-5">
                    <StatusBadge isActive={admin.isActive} />
                  </td>
                  <td className="px-4 py-5">
                    <p className="theme-text">{formatDateTime(admin.lastLoginAt)}</p>
                  </td>
                  <td className="px-4 py-5">
                    <p className="theme-text">{formatDateTime(admin.createdAt)}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(admin)}
                        className="theme-text inline-flex items-center gap-2 rounded-[12px] border border-[var(--app-border-strong)] bg-[var(--app-surface)] px-3 py-2 text-sm font-medium transition hover:bg-[var(--app-hover)]"
                      >
                        <PencilLine className="h-4 w-4" />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRevoke(admin)}
                        disabled={isPending || admin.id === currentAdminUserId}
                        className="inline-flex items-center gap-2 rounded-[12px] border border-[rgba(239,68,68,0.18)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-sm font-medium text-[#ef4444] transition hover:bg-[rgba(239,68,68,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
                        title={
                          admin.id === currentAdminUserId
                            ? "Voce nao pode remover o proprio acesso."
                            : "Revogar acesso ao painel"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen ? (
        <AdminUserModal
          key={`${modalMode}-${selectedAdmin?.id ?? "new"}`}
          isOpen={isModalOpen}
          mode={modalMode}
          initialAdmin={selectedAdmin}
          isPending={isPending}
          errorMessage={errorMessage}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      ) : null}
    </section>
  );
}
