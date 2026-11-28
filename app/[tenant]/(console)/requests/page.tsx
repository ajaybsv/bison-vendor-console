import { RequestsTable } from "@/components/requests/requests-table";
import { listClientRequests } from "@/lib/data";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Requests — BISON" };

export default async function RequestsPage({ params }: PageProps<"/[tenant]/requests">) {
  const { tenant } = await params;
  const { db } = await requireUser(tenant);
  return <RequestsTable tenant={tenant} rows={await listClientRequests(db)} />;
}
