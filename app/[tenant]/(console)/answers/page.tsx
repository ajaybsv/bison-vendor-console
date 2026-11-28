import { CrudPage } from "@/components/entity/crud-page";
import { listTrustAnswers } from "@/lib/data";
import { todayISO } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Answers — BISON" };

export default async function AnswersPage({ params }: PageProps<"/[tenant]/answers">) {
  const { tenant } = await params;
  const { db } = await requireUser(tenant);
  return <CrudPage entity="answers" rows={await listTrustAnswers(db)} today={todayISO()} />;
}
