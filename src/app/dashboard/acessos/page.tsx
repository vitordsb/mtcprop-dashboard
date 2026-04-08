import { DashboardShell } from "@/components/dashboard/app-shell";
import { AdminUsersOverviewView } from "@/components/dashboard/admin-users-overview";
import { requireCurrentAdminUser } from "@/lib/auth/server";
import { getAdminUsersOverview } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function DashboardAccessesPage() {
  const [data, adminUser] = await Promise.all([
    getAdminUsersOverview(),
    requireCurrentAdminUser(),
  ]);

  return (
    <DashboardShell company={data.company} pageTitle="Acessos">
      <AdminUsersOverviewView
        data={data}
        currentAdminUserId={adminUser.id}
      />
    </DashboardShell>
  );
}
