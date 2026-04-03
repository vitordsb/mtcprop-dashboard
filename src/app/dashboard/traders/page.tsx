import { TradersOverviewView } from "@/components/dashboard/traders-overview";
import { getTradersOverview } from "@/lib/api";

export const dynamic = "force-dynamic";

type TradersPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

export default async function TradersPage({ searchParams }: TradersPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getTradersOverview({
    page: resolvedSearchParams.page,
  });

  return <TradersOverviewView data={data} />;
}
