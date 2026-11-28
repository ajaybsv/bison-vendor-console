import { CrudPage } from "@/components/entity/crud-page";
import { listEvidence, listVendors } from "@/lib/data";
import { todayISO } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Evidence — BISON" };

export default async function EvidencePage({ params }: PageProps<"/[tenant]/evidence">) {
  const { tenant } = await params;
  const { db } = await requireUser(tenant);
  const [evidence, vendors] = await Promise.all([listEvidence(db), listVendors(db)]);
  return <CrudPage entity="evidence" rows={evidence} today={todayISO()} vendorNames={vendors.map((v) => v.name)} />;
}
