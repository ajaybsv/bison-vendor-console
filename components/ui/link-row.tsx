"use client";

import { useRouter } from "next/navigation";
import { ClickRow } from "@/components/ui/form";

/** Clickable table row that navigates to `href` — usable from server components. */
export function LinkRow({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  return <ClickRow onActivate={() => router.push(href)}>{children}</ClickRow>;
}
