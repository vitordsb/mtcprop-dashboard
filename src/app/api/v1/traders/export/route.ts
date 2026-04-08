import { getCurrentAdminUser } from "@/lib/auth/server";
import { errorResponse } from "@/lib/http";
import { tradersService } from "@/lib/services/traders-service";

function escapeCsvValue(value: string) {
  const normalized = value.replaceAll('"', '""');
  return `"${normalized}"`;
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function GET(request: Request) {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser) {
    return errorResponse(401, "UNAUTHORIZED", "Sessao invalida ou expirada.");
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const normalizedQuery = normalizeText(q);

  const result = await tradersService.getOverview();
  const filteredTraders = result.traders.filter((trader) => {
    if (!normalizedQuery) {
      return true;
    }

    return [trader.name, trader.email, trader.phone, trader.document].some((field) =>
      normalizeText(field).includes(normalizedQuery),
    );
  });

  const csvLines = [
    ["Nome", "Email", "Telefone", "Documento", "Região", "Data"].join(","),
    ...filteredTraders.map((trader) =>
      [
        escapeCsvValue(trader.name),
        escapeCsvValue(trader.email),
        escapeCsvValue(trader.phone),
        escapeCsvValue(trader.document),
        escapeCsvValue(trader.regionLabel || "Sem região"),
        escapeCsvValue(trader.createdAt || ""),
      ].join(","),
    ),
  ];

  return new Response(csvLines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="traders-guru.csv"',
      "Cache-Control": "no-store",
    },
  });
}
