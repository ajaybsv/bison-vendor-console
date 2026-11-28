import { RegistrationWizard } from "@/components/vendors/registration-wizard";
import { listTeam } from "@/lib/data";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Register a vendor — BISON" };

export default async function NewVendorPage({ params }: PageProps<"/[tenant]/vendors/new">) {
  const { tenant } = await params;
  const { db } = await requireUser(tenant);
  const team = await listTeam(db);
  return <RegistrationWizard tenant={tenant} teamNames={team.map((t) => t.name)} />;
}
