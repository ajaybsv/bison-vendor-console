import { notFound } from "next/navigation";
import { Workspace } from "@/components/requests/workspace";
import { getClientRequest, listEvidence, listQuestions, listTrustAnswers } from "@/lib/data";

export const metadata = { title: "Request workspace — BISON" };

export default async function RequestWorkspacePage({ params }: PageProps<"/requests/[id]">) {
  const { id } = await params;
  const request = await getClientRequest(Number(id));
  if (!request) notFound();
  const [questions, trustAnswers, evidence] = await Promise.all([listQuestions(), listTrustAnswers(), listEvidence()]);
  const { answers, ...rest } = request;
  const initialAnswers = Object.fromEntries(answers.map((a) => [a.questionId, { value: a.value, confirmed: a.confirmed }]));
  return <Workspace request={rest} initialAnswers={initialAnswers} questions={questions} trustAnswers={trustAnswers} evidence={evidence} />;
}
