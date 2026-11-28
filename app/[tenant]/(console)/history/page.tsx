import { HistoryTable } from "@/components/history/history-table";
import { listHistory } from "@/lib/data";
import { requireUser } from "@/lib/session";

export const metadata = { title: "History — BISON" };

export default async function HistoryPage({ params }: PageProps<"/[tenant]/history">) {
  const { tenant } = await params;
  const { db } = await requireUser(tenant);
  return <HistoryTable rows={await listHistory(db)} />;
}
