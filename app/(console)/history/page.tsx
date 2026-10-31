import { HistoryTable } from "@/components/history/history-table";
import { listHistory } from "@/lib/data";

export const metadata = { title: "History — BISON" };

export default async function HistoryPage() {
  return <HistoryTable rows={await listHistory()} />;
}
