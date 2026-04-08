import { ActivePlansOverviewView } from "@/components/dashboard/active-plans-overview";
import { getActivePlansOverview } from "@/lib/api";

export const dynamic = "force-dynamic";

type PlanosAtivosPageProps = {
  searchParams?: Promise<{
    page?: string;
    q?: string;
  }>;
};

export default async function PlanosAtivosPage({ searchParams }: PlanosAtivosPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getActivePlansOverview({
    page: resolvedSearchParams.page,
    q: resolvedSearchParams.q,
  });

  return <ActivePlansOverviewView data={data} />;
}
