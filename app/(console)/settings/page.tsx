import { SettingsForm } from "@/components/settings/settings-form";
import { getOrganization } from "@/lib/data";

export const metadata = { title: "Settings — BISON" };

export default async function SettingsPage() {
  const org = await getOrganization();
  return (
    <SettingsForm
      profile={{
        name: org?.name ?? "",
        regNo: org?.regNo ?? "",
        vendorType: org?.vendorType ?? "Payment Gateway",
        primaryContact: org?.primaryContact ?? "",
        address: org?.address ?? "",
      }}
      notifications={{
        notifReminders: org?.notifReminders ?? true,
        notifDigest: org?.notifDigest ?? true,
        notifExpiry: org?.notifExpiry ?? true,
      }}
    />
  );
}
