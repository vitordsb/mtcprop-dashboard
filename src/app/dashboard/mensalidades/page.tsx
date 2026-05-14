import { MensalidadesOverviewView } from "@/components/dashboard/mensalidades-overview";
import { getMensalidadesOverview } from "@/lib/api";

export const dynamic = "force-dynamic";

type MensalidadesPageProps = {
  searchParams?: Promise<{
    page?: string;
    q?: string;
  }>;
};

export default async function MensalidadesPage({ searchParams }: MensalidadesPageProps) {
  const resolved = (await searchParams) ?? {};
  const data = await getMensalidadesOverview({
    page: resolved.page,
    q: resolved.q,
    limit: 6,
  });

  return <MensalidadesOverviewView data={data} />;
}
