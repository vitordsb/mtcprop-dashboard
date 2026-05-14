import { SolicitacoesOverviewView } from "@/components/dashboard/solicitacoes-overview";
import { getSolicitacoesOverview } from "@/lib/api";

export const dynamic = "force-dynamic";

type SolicitacoesPageProps = {
  searchParams?: Promise<{
    page?: string;
    q?: string;
    status?: string;
    type?: string;
  }>;
};

export default async function SolicitacoesPage({ searchParams }: SolicitacoesPageProps) {
  const resolved = (await searchParams) ?? {};
  const data = await getSolicitacoesOverview({
    page: resolved.page,
    q: resolved.q,
    status: resolved.status ?? "PENDENTE",
    type: resolved.type,
    limit: 6,
  });

  return <SolicitacoesOverviewView data={data} />;
}
