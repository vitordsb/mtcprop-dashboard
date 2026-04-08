import { getCompanySnapshot } from "@/lib/company-snapshot";
import { CACHE_TAGS, DEFAULT_PAGINATION_LIMIT } from "@/lib/constants";
import { getGuruContacts } from "@/lib/services/guru-contacts-client";
import { unstable_cache } from "next/cache";
import type { TradersOverview } from "@/types/traders";

const getCachedTradersOverview = unstable_cache(
  async (): Promise<TradersOverview> => {
    const contacts = await getGuruContacts().catch((error) => {
      console.warn("[guru-contacts] falha ao consultar contatos", error);
      return [];
    });

    const traders = contacts
      .map((contact) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email || "Sem e-mail",
        phone: contact.phone || "Sem telefone",
        document: contact.document || "Sem documento",
        street: contact.street,
        number: contact.number,
        complement: contact.complement,
        district: contact.district,
        zipcode: contact.zipcode,
        city: contact.city,
        state: contact.state,
        country: contact.country,
        regionLabel: contact.regionLabel,
        createdAt: contact.createdAt,
      }));

    return {
      company: getCompanySnapshot(),
      traders,
      defaultPageSize: DEFAULT_PAGINATION_LIMIT,
      guruConfigured: Boolean(
        process.env.GURU_USER_TOKEN?.trim() &&
          !process.env.GURU_USER_TOKEN?.trim().startsWith("cole-o-"),
      ),
      guruContactsAdminUrl:
        process.env.GURU_CONTACTS_ADMIN_URL?.trim() ||
        "https://digitalmanager.guru/admin/contacts",
    };
  },
  [CACHE_TAGS.TRADERS_OVERVIEW],
  { revalidate: 45, tags: [CACHE_TAGS.TRADERS_OVERVIEW] },
);

export const tradersService = {
  async getOverview(): Promise<TradersOverview> {
    return getCachedTradersOverview();
  },
};
