import { CrudPage } from "@/components/entity/crud-page";
import { listTeam } from "@/lib/data";
import { todayISO } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Team & access — BISON" };

export default async function TeamPage({ params }: PageProps<"/[tenant]/team">) {
  const { tenant } = await params;
  const { db } = await requireUser(tenant);
  return <CrudPage entity="team" rows={await listTeam(db)} today={todayISO()} />;
}
