import { CrudPage } from "@/components/entity/crud-page";
import { listTrustAnswers } from "@/lib/data";
import { todayISO } from "@/lib/format";

export const metadata = { title: "Answers — BISON" };

export default async function AnswersPage() {
  return <CrudPage entity="answers" rows={await listTrustAnswers()} today={todayISO()} />;
}
