import { SentRequestsTable } from "@/components/sent-requests/sent-requests-table";
import { listVendorRequests } from "@/lib/data";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Sent Requests — BISON" };

export default async function SentRequestsPage({ params }: PageProps<"/[tenant]/sent-requests">) {
  const { tenant } = await params;
  const { db } = await requireUser(tenant);
  return <SentRequestsTable tenant={tenant} rows={await listVendorRequests(db)} />;
}
