import { CrudPage } from "@/components/entity/crud-page";
import { listIncidents, listTeam, listVendors } from "@/lib/data";
import { todayISO } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Incidents & SLA — BISON" };

export default async function IncidentsPage({ params }: PageProps<"/[tenant]/incidents">) {
  const { tenant } = await params;
  const { db } = await requireUser(tenant);
  const [incidents, team, vendors] = await Promise.all([listIncidents(db), listTeam(db), listVendors(db)]);
  return (
    <CrudPage
      entity="incidents"
      rows={incidents}
      today={todayISO()}
      teamNames={team.map((t) => t.name)}
      vendorNames={vendors.map((v) => v.name)}
    />
  );
}
