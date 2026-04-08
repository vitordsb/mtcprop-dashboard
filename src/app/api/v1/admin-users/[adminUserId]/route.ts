import { revalidateTag } from "next/cache";

import { getCurrentAdminUser } from "@/lib/auth/server";
import { CACHE_TAGS } from "@/lib/constants";
import { errorResponse, successResponse } from "@/lib/http";
import { adminUsersService } from "@/lib/services/admin-users-service";
import { updateAdminUserSchema } from "@/validators/admin-user";

type RouteContext = {
  params: Promise<{
    adminUserId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser) {
    return errorResponse(401, "UNAUTHORIZED", "Sessao invalida ou expirada.");
  }

  const { adminUserId } = await context.params;

  try {
    const input = updateAdminUserSchema.parse(await request.json());
    const updatedAdminUser = await adminUsersService.update(
      adminUser,
      adminUserId,
      input,
    );

    revalidateTag(CACHE_TAGS.ADMIN_USERS_OVERVIEW, {});

    return successResponse({
      adminUser: updatedAdminUser,
    });
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(400, "INVALID_REQUEST", error.message);
    }

    return errorResponse(
      400,
      "INVALID_REQUEST",
      "Nao foi possivel atualizar o acesso administrativo.",
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser) {
    return errorResponse(401, "UNAUTHORIZED", "Sessao invalida ou expirada.");
  }

  const { adminUserId } = await context.params;

  try {
    const revokedAdminUser = await adminUsersService.revoke(adminUser, adminUserId);

    revalidateTag(CACHE_TAGS.ADMIN_USERS_OVERVIEW, {});

    return successResponse({
      adminUser: revokedAdminUser,
    });
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(400, "INVALID_REQUEST", error.message);
    }

    return errorResponse(
      400,
      "INVALID_REQUEST",
      "Nao foi possivel remover o acesso administrativo.",
    );
  }
}
