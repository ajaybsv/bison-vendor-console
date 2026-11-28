import { CrudPage } from "@/components/entity/crud-page";
import { listIssues, listTeam, listVendors } from "@/lib/data";
import { todayISO } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Issues & Exceptions — BISON" };

export default async function IssuesPage({ params }: PageProps<"/[tenant]/issues">) {
  const { tenant } = await params;
  const { db } = await requireUser(tenant);
  const [issues, team, vendors] = await Promise.all([listIssues(db), listTeam(db), listVendors(db)]);
  return (
    <CrudPage
      entity="issues"
      rows={issues}
      today={todayISO()}
      teamNames={team.map((t) => t.name)}
      vendorNames={vendors.map((v) => v.name)}
    />
  );
}
