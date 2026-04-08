import { revalidateTag } from "next/cache";

import { getCurrentAdminUser } from "@/lib/auth/server";
import { CACHE_TAGS } from "@/lib/constants";
import { errorResponse, successResponse } from "@/lib/http";
import { adminUsersService } from "@/lib/services/admin-users-service";
import { createAdminUserSchema } from "@/validators/admin-user";

export async function GET() {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser) {
    return errorResponse(401, "UNAUTHORIZED", "Sessao invalida ou expirada.");
  }

  const overview = await adminUsersService.getOverview();
  return successResponse(overview);
}

export async function POST(request: Request) {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser) {
    return errorResponse(401, "UNAUTHORIZED", "Sessao invalida ou expirada.");
  }

  try {
    const input = createAdminUserSchema.parse(await request.json());
    const createdAdminUser = await adminUsersService.create(adminUser, input);

    revalidateTag(CACHE_TAGS.ADMIN_USERS_OVERVIEW, {});

    return successResponse(
      {
        adminUser: createdAdminUser,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(400, "INVALID_REQUEST", error.message);
    }

    return errorResponse(
      400,
      "INVALID_REQUEST",
      "Nao foi possivel criar o acesso administrativo.",
    );
  }
}
