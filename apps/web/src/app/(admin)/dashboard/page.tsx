import { redirect } from "next/navigation";

// In production, verify admin role from session
async function getAdminSession() {
  return { user: { id: "admin-1", email: "admin@example.com", role: "admin" } };
}

interface SystemStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  mrrUsd: number;
  totalProjects: number;
  suspendedTenants: number;
}

async function getSystemStats(): Promise<SystemStats> {
  // In production: query DB and Stripe
  return {
    totalTenants: 142,
    activeTenants: 128,
    totalUsers: 1847,
    mrrUsd: 24350,
    totalProjects: 3921,
    suspendedTenants: 3,
  };
}

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (session.user.role !== "admin") redirect("/dashboard");

  const stats = await getSystemStats();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide overview. Visible to admins only.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Total Tenants" value={stats.totalTenants} sub={`${stats.activeTenants} active`} />
        <StatTile label="Total Users" value={stats.totalUsers.toLocaleString()} />
        <StatTile
          label="MRR"
          value={`$${(stats.mrrUsd / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
        />
        <StatTile label="Total Projects" value={stats.totalProjects.toLocaleString()} />
        <StatTile
          label="Suspended Tenants"
          value={stats.suspendedTenants}
          sub="Payment failures"
        />
        <StatTile
          label="Churn Risk"
          value={`${((stats.totalTenants - stats.activeTenants) / stats.totalTenants * 100).toFixed(1)}%`}
          sub="Inactive or suspended"
        />
      </div>

      <div className="rounded-xl border p-6">
        <h2 className="mb-4 font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <a href="/admin/tenants" className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
            Manage Tenants
          </a>
          <a href="/admin/users" className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
            Manage Users
          </a>
          <a href="/admin/audit-log" className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
            Audit Log
          </a>
          <a href="/admin/billing" className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
            Billing Overview
          </a>
        </div>
      </div>
    </div>
  );
}
