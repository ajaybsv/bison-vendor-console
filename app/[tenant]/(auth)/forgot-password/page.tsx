import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = { title: "Forgot password — BISON" };

export default async function ForgotPasswordPage({ params }: PageProps<"/[tenant]/forgot-password">) {
  const { tenant } = await params;
  return <ForgotPasswordForm tenant={tenant} />;
}
