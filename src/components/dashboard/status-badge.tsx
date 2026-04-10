import type { ReactNode } from "react";

type StatusBadgeProps = {
  tone: "brand" | "neutral" | "warning" | "danger";
  children: ReactNode;
};

const toneClasses: Record<StatusBadgeProps["tone"], string> = {
  brand:
    "border-[rgba(69,225,95,0.32)] bg-[rgba(69,225,95,0.14)] text-[var(--brand)]",
  neutral:
    "border-[var(--app-border-soft)] bg-[var(--app-surface-soft)] text-[var(--app-text-subtle)]",
  warning:
    "border-[rgba(245,200,107,0.28)] bg-[rgba(245,200,107,0.12)] text-[var(--warning)]",
  danger:
    "border-[rgba(255,123,123,0.28)] bg-[rgba(255,123,123,0.12)] text-[var(--danger)]",
};

export type SemanticStatusTone = "success" | "danger" | "warning" | "neutral";

function normalizeStatus(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const SUCCESS_KEYWORDS = [
  "ativo",
  "active",
  "aprovada",
  "approved",
  "confirmada",
  "confirmed",
  "completed",
  "paid",
  "pago",
  "liberado",
  "liberada",
  "success",
];

const WARNING_KEYWORDS = [
  "pendente",
  "pending",
  "aguardando",
  "analise",
  "em analise",
  "processing",
  "ativo (outra corretora)",
  "outra corretora",
];

const NEUTRAL_KEYWORDS = [
  "inativo",
  "inactive",
  "desativado",
  "disabled",
  "sem licenca",
  "sem licença",
  "nao informado",
  "não informado",
];

const DANGER_KEYWORDS = [
  "recusado",
  "recusada",
  "refused",
  "rejected",
  "cancelado",
  "cancelada",
  "canceled",
  "cancelled",
  "abandonada",
  "abandoned",
  "expirada",
  "expired",
  "chargeback",
  "reembolsada",
  "refunded",
  "inadimplente",
  "bloqueado",
  "blocked",
];

export function getSemanticStatusTone(value: string | null | undefined): SemanticStatusTone {
  const normalized = normalizeStatus(value);

  if (!normalized) {
    return "neutral";
  }

  if (SUCCESS_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "success";
  }

  if (WARNING_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "warning";
  }

  if (NEUTRAL_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "neutral";
  }

  if (DANGER_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "danger";
  }

  return "neutral";
}

export function getSemanticStatusBadgeClass(value: string | null | undefined) {
  const tone = getSemanticStatusTone(value);

  switch (tone) {
    case "success":
      return toneClasses.brand;
    case "warning":
      return toneClasses.warning;
    case "danger":
      return toneClasses.danger;
    case "neutral":
    default:
      return toneClasses.neutral;
  }
}

export function getSemanticStatusTextClass(value: string | null | undefined) {
  const tone = getSemanticStatusTone(value);

  switch (tone) {
    case "success":
      return "text-[#319247] dark:text-emerald-300";
    case "warning":
      return "text-[#d37a16] dark:text-amber-300";
    case "danger":
      return "text-[#d9534f] dark:text-rose-300";
    case "neutral":
    default:
      return "text-[var(--app-text-subtle)]";
  }
}

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
