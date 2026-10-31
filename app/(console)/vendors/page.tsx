import { VendorsTable } from "@/components/vendors/vendors-table";
import { listTeam, listVendorRequests, listVendors } from "@/lib/data";
import { todayISO } from "@/lib/format";
import { questionCountsByControl } from "@/lib/questions";

export const metadata = { title: "Vendors — BISON" };

export default async function VendorsPage({ searchParams }: PageProps<"/vendors">) {
  const { send } = await searchParams;
  const [vendors, cycles, team, questionCounts] = await Promise.all([
    listVendors(),
    listVendorRequests(),
    listTeam(),
    questionCountsByControl(),
  ]);
  return (
    <VendorsTable
      vendors={vendors}
      cycles={cycles}
      teamNames={team.map((t) => t.name)}
      questionCounts={questionCounts}
      today={todayISO()}
      initialSendId={typeof send === "string" ? Number(send) : null}
    />
  );
}
