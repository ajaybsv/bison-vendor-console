import { RequestsTable } from "@/components/requests/requests-table";
import { listClientRequests } from "@/lib/data";

export const metadata = { title: "Requests — BISON" };

export default async function RequestsPage() {
  return <RequestsTable rows={await listClientRequests()} />;
}
