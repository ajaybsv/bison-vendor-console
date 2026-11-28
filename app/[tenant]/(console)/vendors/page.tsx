import { VendorsTable } from "@/components/vendors/vendors-table";
import { getOrganization, listTeam, listVendorRequests, listVendors } from "@/lib/data";
import { todayISO } from "@/lib/format";
import { questionCountsByControl } from "@/lib/questions";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Vendors — BISON" };

export default async function VendorsPage({ params, searchParams }: PageProps<"/[tenant]/vendors">) {
  const { tenant } = await params;
  const { send } = await searchParams;
  const { db } = await requireUser(tenant);
  const [vendors, cycles, team, questionCounts, org] = await Promise.all([
    listVendors(db),
    listVendorRequests(db),
    listTeam(db),
    questionCountsByControl(db),
    getOrganization(db),
  ]);
  return (
    <VendorsTable
      tenant={tenant}
      vendors={vendors}
      cycles={cycles}
      teamNames={team.map((t) => t.name)}
      questionCounts={questionCounts}
      today={todayISO()}
      initialSendId={typeof send === "string" ? Number(send) : null}
      org={org}
    />
  );
}
