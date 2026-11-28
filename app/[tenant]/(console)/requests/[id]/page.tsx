import { notFound } from "next/navigation";
import { Workspace } from "@/components/requests/workspace";
import { getClientRequest, listEvidence, listQuestions, listTrustAnswers } from "@/lib/data";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Request workspace — BISON" };

export default async function RequestWorkspacePage({ params }: PageProps<"/[tenant]/requests/[id]">) {
  const { tenant, id } = await params;
  const { db } = await requireUser(tenant);
  const request = await getClientRequest(db, Number(id));
  if (!request) notFound();
  const [questions, trustAnswers, evidence] = await Promise.all([listQuestions(db), listTrustAnswers(db), listEvidence(db)]);
  const { answers, ...rest } = request;
  const initialAnswers = Object.fromEntries(answers.map((a) => [a.questionId, { value: a.value, confirmed: a.confirmed }]));
  return <Workspace tenant={tenant} request={rest} initialAnswers={initialAnswers} questions={questions} trustAnswers={trustAnswers} evidence={evidence} />;
}
