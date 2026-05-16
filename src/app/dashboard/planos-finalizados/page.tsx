import { ActivePlansOverviewView } from "@/components/dashboard/active-plans-overview";
import { getActivePlansOverview } from "@/lib/api";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    page?: string;
    q?: string;
  }>;
};

export default async function PlanosFinalizadosPage({ searchParams }: PageProps) {
  const resolved = (await searchParams) ?? {};
  const data = await getActivePlansOverview({
    page: resolved.page,
    q: resolved.q,
    limit: 6,
    approvalFilter: "DECIDED",
  });

  return (
    <ActivePlansOverviewView
      data={data}
      pageTitle="Planos Finalizados"
      basePath="/dashboard/planos-finalizados"
    />
  );
}
