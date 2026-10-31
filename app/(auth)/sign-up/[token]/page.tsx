import { notFound } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getInvite, getOrganization } from "@/lib/data";

export const metadata = { title: "Complete your account — BISON" };

export default async function SignUpPage({ params }: PageProps<"/sign-up/[token]">) {
  const { token } = await params;
  const [inv, org] = await Promise.all([getInvite(token), getOrganization()]);
  if (!inv) notFound();
  return (
    <SignUpForm
      token={token}
      orgName={org?.name ?? "PayBridge Systems"}
      invite={{ name: inv.name, email: inv.email, role: inv.role }}
    />
  );
}
