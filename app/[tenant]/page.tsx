import { redirect } from "next/navigation";

export default async function TenantRoot({ params }: PageProps<"/[tenant]">) {
  const { tenant } = await params;
  redirect(`/${tenant}/dashboard`);
}
