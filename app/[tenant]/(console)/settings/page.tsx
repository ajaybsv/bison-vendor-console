import { SettingsForm } from "@/components/settings/settings-form";
import { DEFAULT_APPROVAL_CONFIG } from "@/lib/approval";
import { getOrganization } from "@/lib/data";
import { requireUser } from "@/lib/session";
import { DEFAULT_TIER_CONFIG } from "@/lib/tiering";

export const metadata = { title: "Settings — BISON" };

export default async function SettingsPage({ params }: PageProps<"/[tenant]/settings">) {
  const { tenant } = await params;
  const { db } = await requireUser(tenant);
  const org = await getOrganization(db);
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
      materiality={{
        materialityDisruptionHours: org?.materialityDisruptionHours ?? "",
        materialityCustomerPct: org?.materialityCustomerPct ?? "",
        materialityFinancialImpact: org?.materialityFinancialImpact ?? "",
      }}
      governance={{
        tierConcentrationTrigger: org?.tierConcentrationTrigger ?? DEFAULT_TIER_CONFIG.concentrationTrigger,
        tierLimitedAlternativesTrigger: org?.tierLimitedAlternativesTrigger ?? DEFAULT_TIER_CONFIG.limitedAlternativesTrigger,
        approvalCeoTrigger: org?.approvalCeoTrigger ?? DEFAULT_APPROVAL_CONFIG.ceoTrigger,
        approvalBoardTrigger: org?.approvalBoardTrigger ?? DEFAULT_APPROVAL_CONFIG.boardTrigger,
      }}
    />
  );
}
