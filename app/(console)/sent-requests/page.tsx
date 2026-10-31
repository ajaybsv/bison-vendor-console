import { SentRequestsTable } from "@/components/sent-requests/sent-requests-table";
import { listVendorRequests } from "@/lib/data";

export const metadata = { title: "Sent Requests — BISON" };

export default async function SentRequestsPage() {
  return <SentRequestsTable rows={await listVendorRequests()} />;
}
