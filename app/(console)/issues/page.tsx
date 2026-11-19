import { CrudPage } from "@/components/entity/crud-page";
import { listIssues, listTeam, listVendors } from "@/lib/data";
import { todayISO } from "@/lib/format";

export const metadata = { title: "Issues & Exceptions — BISON" };

export default async function IssuesPage() {
  const [issues, team, vendors] = await Promise.all([listIssues(), listTeam(), listVendors()]);
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
