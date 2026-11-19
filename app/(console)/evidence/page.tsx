import { CrudPage } from "@/components/entity/crud-page";
import { listEvidence, listVendors } from "@/lib/data";
import { todayISO } from "@/lib/format";

export const metadata = { title: "Evidence — BISON" };

export default async function EvidencePage() {
  const [evidence, vendors] = await Promise.all([listEvidence(), listVendors()]);
  return <CrudPage entity="evidence" rows={evidence} today={todayISO()} vendorNames={vendors.map((v) => v.name)} />;
}
