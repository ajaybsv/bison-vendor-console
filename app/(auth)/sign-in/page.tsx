import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getOrganization, latestPendingInvite } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Sign in — BISON" };

export default async function SignInPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  const [org, invite] = await Promise.all([getOrganization(), latestPendingInvite()]);
  return (
    <SignInForm
      orgName={org?.name ?? "PayBridge Systems"}
      invite={invite?.inviteToken ? { name: invite.name, token: invite.inviteToken } : null}
    />
  );
}
