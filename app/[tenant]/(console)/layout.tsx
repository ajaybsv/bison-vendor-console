import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getOrganization, navCounts } from "@/lib/data";
import { requireUser } from "@/lib/session";

export default async function ConsoleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const auth = await requireUser(tenant);
  const [counts, org] = await Promise.all([navCounts(auth.db), getOrganization(auth.db)]);
  return (
    <div className="app">
      <Topbar user={auth} orgName={org?.name ?? "PayBridge Systems"} />
      <Sidebar counts={counts} tenant={tenant} />
      <main className="main">{children}</main>
    </div>
  );
}
