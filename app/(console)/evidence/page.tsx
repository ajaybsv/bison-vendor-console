import { CrudPage } from "@/components/entity/crud-page";
import { listEvidence } from "@/lib/data";
import { todayISO } from "@/lib/format";

export const metadata = { title: "Evidence — BISON" };

export default async function EvidencePage() {
  return <CrudPage entity="evidence" rows={await listEvidence()} today={todayISO()} />;
}
