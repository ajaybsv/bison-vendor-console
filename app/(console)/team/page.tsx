import { CrudPage } from "@/components/entity/crud-page";
import { listTeam } from "@/lib/data";
import { todayISO } from "@/lib/format";

export const metadata = { title: "Team & access — BISON" };

export default async function TeamPage() {
  return <CrudPage entity="team" rows={await listTeam()} today={todayISO()} />;
}
