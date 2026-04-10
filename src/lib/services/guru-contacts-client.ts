import { cache } from "react";
import { z } from "zod";

import { CACHE_TAGS } from "@/lib/constants";
import { fetchGuruWithReadAuth, getGuruReadToken } from "@/lib/services/guru-auth";

const stringishValueSchema = z
  .union([z.string(), z.number(), z.boolean()])
  .transform((value) => String(value));

const nullableStringishValueSchema = z
  .union([z.string(), z.number(), z.boolean(), z.null(), z.undefined()])
  .transform((value) => (value == null ? null : String(value)));

const guruContactSchema = z
  .object({
    id: stringishValueSchema,
    name: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    doc: nullableStringishValueSchema.optional(),
    street: nullableStringishValueSchema.optional(),
    address_street: nullableStringishValueSchema.optional(),
    number: nullableStringishValueSchema.optional(),
    address_number: nullableStringishValueSchema.optional(),
    complement: nullableStringishValueSchema.optional(),
    address_complement: nullableStringishValueSchema.optional(),
    district: nullableStringishValueSchema.optional(),
    address_district: nullableStringishValueSchema.optional(),
    zipcode: nullableStringishValueSchema.optional(),
    address_zipcode: nullableStringishValueSchema.optional(),
    country: nullableStringishValueSchema.optional(),
    state: nullableStringishValueSchema.optional(),
    city: nullableStringishValueSchema.optional(),
    address_country: nullableStringishValueSchema.optional(),
    address_state: nullableStringishValueSchema.optional(),
    address_city: nullableStringishValueSchema.optional(),
    created_at: nullableStringishValueSchema.optional(),
    createdAt: nullableStringishValueSchema.optional(),
    phone_local_code: nullableStringishValueSchema.optional(),
    phone_number: nullableStringishValueSchema.optional(),
    cellphone_local_code: nullableStringishValueSchema.optional(),
    cellphone_number: nullableStringishValueSchema.optional(),
    cellphone: nullableStringishValueSchema.optional(),
    phone: nullableStringishValueSchema.optional(),
  })
  .passthrough();

const guruContactListSchema = z
  .object({
    data: z.array(guruContactSchema).default([]),
    has_more_pages: z.coerce.number().optional(),
    next_cursor: z.string().nullable().optional(),
  })
  .passthrough();

export type GuruContactSnapshot = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  zipcode: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  regionLabel: string | null;
  createdAt: string | null;
};

export type CreateGuruContactInput = {
  name: string;
  email: string;
  document?: string;
  cellphone: string;
  country: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state: string;
  zipcode?: string;
};

function normalizePhone(contact: z.infer<typeof guruContactSchema>) {
  if (contact.cellphone) {
    return contact.cellphone;
  }

  if (contact.phone) {
    return contact.phone;
  }

  const cellphone = `${contact.cellphone_local_code ?? ""}${contact.cellphone_number ?? ""}`.trim();
  if (cellphone) {
    return cellphone;
  }

  const phone = `${contact.phone_local_code ?? ""}${contact.phone_number ?? ""}`.trim();
  return phone || null;
}

function pickLocationValue(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function toGuruContactSnapshot(contact: z.infer<typeof guruContactSchema>): GuruContactSnapshot {
  const city = pickLocationValue(contact.city, contact.address_city);
  const state = pickLocationValue(contact.state, contact.address_state);
  const country = pickLocationValue(contact.country, contact.address_country);

  return {
    id: contact.id,
    name: contact.name?.trim() || "Sem nome",
    email: contact.email?.trim().toLowerCase() || "",
    phone: normalizePhone(contact),
    document: contact.doc ?? null,
    street: pickLocationValue(contact.street, contact.address_street),
    number: pickLocationValue(contact.number, contact.address_number),
    complement: pickLocationValue(contact.complement, contact.address_complement),
    district: pickLocationValue(contact.district, contact.address_district),
    zipcode: pickLocationValue(contact.zipcode, contact.address_zipcode),
    city,
    state,
    country,
    regionLabel: [city, state, country].filter(Boolean).join(" • ") || null,
    createdAt: pickLocationValue(contact.created_at, contact.createdAt),
  };
}

async function requestAllGuruContacts() {
  const guruUserToken = getGuruReadToken();

  if (!guruUserToken) {
    return [] as GuruContactSnapshot[];
  }

  const baseUrl = process.env.GURU_API_BASE_URL || "https://digitalmanager.guru/api/v2";
  const contacts: GuruContactSnapshot[] = [];
  let cursor: string | null | undefined = undefined;
  let safetyCounter = 0;

  do {
    const searchParams = new URLSearchParams();
    if (cursor) {
      searchParams.set("cursor", cursor);
    }

    const response = await fetchGuruWithReadAuth(`${baseUrl}/contacts?${searchParams.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 60, tags: [CACHE_TAGS.TRADERS_OVERVIEW] },
    });

    if (!response.ok) {
      throw new Error(`[Guru] HTTP ${response.status} ao consultar contacts.`);
    }

    const payload = guruContactListSchema.parse(await response.json());

    contacts.push(
      ...payload.data.map(toGuruContactSnapshot),
    );

    cursor = payload.has_more_pages ? payload.next_cursor : null;
    safetyCounter += 1;
  } while (cursor && safetyCounter < 100);

  return contacts;
}

async function requestGuruContactById(contactId: string) {
  const guruUserToken = getGuruReadToken();

  if (!guruUserToken) {
    return null;
  }

  const baseUrl = process.env.GURU_API_BASE_URL || "https://digitalmanager.guru/api/v2";
  const response = await fetchGuruWithReadAuth(`${baseUrl}/contacts/${contactId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 60, tags: [CACHE_TAGS.TRADERS_OVERVIEW] },
  });

  if (!response.ok) {
    return null;
  }

  const payload = guruContactSchema.parse(await response.json());
  return toGuruContactSnapshot(payload);
}

function splitCellphone(country: string, cellphone: string) {
  const normalized = cellphone.replace(/\D/g, "");
  const fallbackLocalCode = country.toUpperCase() === "BR" ? "55" : "";

  if (!normalized) {
    return {
      cellphone_local_code: fallbackLocalCode,
      cellphone_number: "",
    };
  }

  if (country.toUpperCase() === "BR") {
    if (normalized.startsWith("55") && normalized.length > 11) {
      return {
        cellphone_local_code: "55",
        cellphone_number: normalized.slice(2),
      };
    }

    return {
      cellphone_local_code: "55",
      cellphone_number: normalized,
    };
  }

  return {
    cellphone_local_code: fallbackLocalCode,
    cellphone_number: normalized,
  };
}

export async function createGuruContact(input: CreateGuruContactInput) {
  const guruUserToken = getGuruReadToken();

  if (!guruUserToken) {
    throw new Error("Nenhum token de leitura/escrita da Guru configurado.");
  }

  const baseUrl = process.env.GURU_API_BASE_URL || "https://digitalmanager.guru/api/v2";
  const { cellphone_local_code, cellphone_number } = splitCellphone(
    input.country,
    input.cellphone,
  );
  const normalizedCountry = input.country.toUpperCase();
  const normalizedState = input.state.trim().toUpperCase();

  const payload = {
    name: input.name,
    email: input.email,
    doc: input.document || undefined,
    phone_local_code: cellphone_local_code,
    phone_number: cellphone_number,
    cellphone_local_code,
    cellphone_number,
    country: normalizedCountry,
    address_country: normalizedCountry,
    street: input.street || undefined,
    address_street: input.street || undefined,
    number: input.number || undefined,
    address_number: input.number || undefined,
    complement: input.complement || undefined,
    address_complement: input.complement || undefined,
    district: input.district || undefined,
    address_district: input.district || undefined,
    city: input.city || undefined,
    address_city: input.city || undefined,
    state: normalizedState,
    address_state: normalizedState,
    zipcode: input.zipcode || undefined,
    address_zipcode: input.zipcode || undefined,
  };

  const response = await fetchGuruWithReadAuth(`${baseUrl}/contacts`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const rawError = await response.text();
    throw new Error(
      `[Guru] HTTP ${response.status} ao criar contato. ${rawError || "Sem detalhes."}`,
    );
  }

  return response.json();
}

export const getGuruContacts = cache(async () => {
  const contacts = await requestAllGuruContacts();

  return contacts.sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
});

export const getGuruContactById = cache(async (contactId: string) => {
  const normalizedContactId = contactId.trim();

  if (!normalizedContactId) {
    return null;
  }

  const directContact = await requestGuruContactById(normalizedContactId).catch(() => null);
  if (directContact) {
    return directContact;
  }

  const contacts = await getGuruContacts();
  return contacts.find((contact) => contact.id === normalizedContactId) ?? null;
});
