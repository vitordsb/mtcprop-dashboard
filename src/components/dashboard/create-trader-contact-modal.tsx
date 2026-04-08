"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

const COUNTRY_OPTIONS = [
  { value: "BR", label: "Brasil" },
  { value: "PT", label: "Portugal" },
  { value: "US", label: "Estados Unidos" },
  { value: "AR", label: "Argentina" },
];

const REQUIRED_FIELD_LABEL =
  "theme-text block text-sm font-medium";

const FIELD_CLASSNAME =
  "theme-input w-full rounded-[12px] border px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]";

type ContactFormState = {
  name: string;
  email: string;
  document: string;
  cellphone: string;
  country: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  zipcode: string;
};

const INITIAL_STATE: ContactFormState = {
  name: "",
  email: "",
  document: "",
  cellphone: "",
  country: "BR",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  zipcode: "",
};

export function CreateTraderContactModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ContactFormState>(INITIAL_STATE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const otherContactsPreview = useMemo(
    () => ["Financeiro", "Suporte", "Comercial"],
    [],
  );

  function openModal() {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsOpen(true);
  }

  function closeModal() {
    if (isPending) return;
    setIsOpen(false);
  }

  function updateField<Key extends keyof ContactFormState>(
    key: Key,
    value: ContactFormState[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm(INITIAL_STATE);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/v1/traders/contacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        const payload = await response.json();

        if (!response.ok) {
          setErrorMessage(payload?.error?.message || "Nao foi possivel criar o contato.");
          return;
        }

        setSuccessMessage("Contato criado com sucesso na Guru.");
        resetForm();
        setIsOpen(false);
        router.refresh();
      } catch {
        setErrorMessage("Falha inesperada ao criar o contato.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="theme-button-primary inline-flex items-center gap-2 rounded-[12px] px-4 py-2 text-sm font-semibold transition"
      >
        <Plus className="h-4 w-4" />
        Adicionar contato
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(7,17,8,0.52)] px-4 py-8 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={closeModal}
            aria-hidden="true"
          />

          <div className="theme-card relative z-10 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[24px]">
            <div className="theme-shell-surface flex items-center justify-between border-b border-[var(--app-border-soft)] px-6 py-5">
              <div>
                <h2 className="theme-title text-2xl font-semibold tracking-[-0.04em]">
                  Adicionar Contato
                </h2>
                <p className="theme-text-subtle mt-1 text-sm">
                  Cadastro interno com envio direto para a Guru.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="theme-icon-button flex h-10 w-10 items-center justify-center rounded-[12px] transition"
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[calc(90vh-88px)] overflow-y-auto px-6 py-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={REQUIRED_FIELD_LABEL}>
                    Nome completo *
                  </label>
                  <input
                    className={`${FIELD_CLASSNAME} mt-2`}
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Nome completo do contato"
                    required
                  />
                </div>

                <div>
                  <label className={REQUIRED_FIELD_LABEL}>
                    Email *
                  </label>
                  <input
                    type="email"
                    className={`${FIELD_CLASSNAME} mt-2`}
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>

                <div>
                  <label className="theme-text block text-sm font-medium">
                    Documento
                  </label>
                  <input
                    className={`${FIELD_CLASSNAME} mt-2`}
                    value={form.document}
                    onChange={(event) => updateField("document", event.target.value)}
                    placeholder="CPF ou documento"
                  />
                </div>

                <div>
                  <label className={REQUIRED_FIELD_LABEL}>
                    Celular *
                  </label>
                  <input
                    className={`${FIELD_CLASSNAME} mt-2`}
                    value={form.cellphone}
                    onChange={(event) => updateField("cellphone", event.target.value)}
                    placeholder="+55 11 99999-9999"
                    required
                  />
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-4 flex items-center gap-3">
                  <span className="theme-accent-soft inline-flex h-[2px] w-10 rounded-full" />
                  <h3 className="theme-title text-xl font-semibold tracking-[-0.03em]">
                    Endereço
                  </h3>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={REQUIRED_FIELD_LABEL}>
                      País *
                    </label>
                    <select
                      className={`${FIELD_CLASSNAME} mt-2`}
                      value={form.country}
                      onChange={(event) => updateField("country", event.target.value)}
                      required
                    >
                      {COUNTRY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={REQUIRED_FIELD_LABEL}>
                      Estado *
                    </label>
                    <input
                      className={`${FIELD_CLASSNAME} mt-2`}
                      value={form.state}
                      onChange={(event) => updateField("state", event.target.value)}
                      placeholder="SP"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="theme-text block text-sm font-medium">
                      Rua
                    </label>
                    <input
                      className={`${FIELD_CLASSNAME} mt-2`}
                      value={form.street}
                      onChange={(event) => updateField("street", event.target.value)}
                      placeholder="Rua, avenida, alameda..."
                    />
                  </div>

                  <div>
                    <label className="theme-text block text-sm font-medium">
                      Número
                    </label>
                    <input
                      className={`${FIELD_CLASSNAME} mt-2`}
                      value={form.number}
                      onChange={(event) => updateField("number", event.target.value)}
                      placeholder="123"
                    />
                  </div>

                  <div>
                    <label className="theme-text block text-sm font-medium">
                      Complemento
                    </label>
                    <input
                      className={`${FIELD_CLASSNAME} mt-2`}
                      value={form.complement}
                      onChange={(event) => updateField("complement", event.target.value)}
                      placeholder="Sala, apto, bloco..."
                    />
                  </div>

                  <div>
                    <label className="theme-text block text-sm font-medium">
                      Bairro
                    </label>
                    <input
                      className={`${FIELD_CLASSNAME} mt-2`}
                      value={form.district}
                      onChange={(event) => updateField("district", event.target.value)}
                      placeholder="Bairro"
                    />
                  </div>

                  <div>
                    <label className="theme-text block text-sm font-medium">
                      Cidade
                    </label>
                    <input
                      className={`${FIELD_CLASSNAME} mt-2`}
                      value={form.city}
                      onChange={(event) => updateField("city", event.target.value)}
                      placeholder="Cidade"
                    />
                  </div>

                  <div>
                    <label className="theme-text block text-sm font-medium">
                      CEP
                    </label>
                    <input
                      className={`${FIELD_CLASSNAME} mt-2`}
                      value={form.zipcode}
                      onChange={(event) => updateField("zipcode", event.target.value)}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-3 flex items-center gap-3">
                  <span className="theme-accent-soft inline-flex h-[2px] w-10 rounded-full" />
                  <h3 className="theme-title text-lg font-semibold tracking-[-0.03em]">
                    Grupo de outros contatos
                  </h3>
                </div>

                <div className="theme-card-soft rounded-[18px] border-dashed px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {otherContactsPreview.map((group) => (
                      <span
                        key={group}
                        className="theme-pill-soft theme-text-subtle inline-flex rounded-full px-3 py-1 text-[12px] font-medium"
                      >
                        {group}
                      </span>
                    ))}
                  </div>
                  <p className="theme-text-subtle mt-3 text-sm">
                    Essa parte fica apenas como visualização por enquanto. O vínculo com grupos ainda não será enviado.
                  </p>
                </div>
              </div>

              {errorMessage ? (
                <div className="theme-danger-box mt-6 rounded-[14px] px-4 py-3 text-sm">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="theme-accent-soft mt-6 rounded-[14px] px-4 py-3 text-sm">
                  {successMessage}
                </div>
              ) : null}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[var(--app-border-soft)] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    closeModal();
                  }}
                  className="theme-text inline-flex items-center justify-center rounded-[12px] border border-[var(--app-border-strong)] bg-[var(--app-surface)] px-4 py-3 text-sm font-medium transition hover:bg-[var(--app-hover)]"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="theme-button-primary inline-flex items-center justify-center rounded-[12px] px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? "Criando contato..." : "Salvar contato"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
