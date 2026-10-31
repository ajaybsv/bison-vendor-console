import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getOrganization, navCounts } from "@/lib/data";
import { requireUser } from "@/lib/session";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [counts, org] = await Promise.all([navCounts(), getOrganization()]);
  return (
    <div className="app">
      <Topbar user={user} orgName={org?.name ?? "PayBridge Systems"} />
      <Sidebar counts={counts} />
      <main className="main">{children}</main>
    </div>
  );
}
