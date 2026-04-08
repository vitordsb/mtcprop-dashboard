import { getCurrentAdminUser } from "@/lib/auth/server";
import { ensureDatabaseEnv } from "@/lib/env/resolve-database-env";
import { errorResponse, successResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser) {
    return errorResponse(401, "UNAUTHORIZED", "Sessao invalida ou expirada.");
  }

  const resolved = ensureDatabaseEnv(process.env);

  if (!resolved.databaseUrl || !resolved.directUrl) {
    return errorResponse(
      500,
      "DATABASE_NOT_CONFIGURED",
      "Configuração do banco ausente para o App.",
    );
  }

  const [row] = await prisma.$queryRaw<
    Array<{ current_database: string; current_schema: string; now: Date }>
  >`SELECT current_database(), current_schema(), now()`;

  return successResponse({
    source: resolved.source,
    database: row?.current_database ?? null,
    schema: row?.current_schema ?? null,
    serverTime: row?.now?.toISOString?.() ?? null,
    usingSupabaseDerivedUrls: resolved.source === "supabase-derived",
  });
}
