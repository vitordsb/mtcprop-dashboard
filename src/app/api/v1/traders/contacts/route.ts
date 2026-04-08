import { revalidateTag } from "next/cache";

import { getCurrentAdminUser } from "@/lib/auth/server";
import { errorResponse, successResponse } from "@/lib/http";
import { CACHE_TAGS } from "@/lib/constants";
import { createGuruContact } from "@/lib/services/guru-contacts-client";
import { createGuruContactSchema } from "@/validators/trader";

export async function POST(request: Request) {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser) {
    return errorResponse(401, "UNAUTHORIZED", "Sessao invalida ou expirada.");
  }

  try {
    const input = createGuruContactSchema.parse(await request.json());
    const createdContact = await createGuruContact(input);

    revalidateTag(CACHE_TAGS.TRADERS_OVERVIEW, {});

    return successResponse({
      contact: createdContact,
    });
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(400, "INVALID_REQUEST", error.message);
    }

    return errorResponse(400, "INVALID_REQUEST", "Nao foi possivel criar o contato.");
  }
}
