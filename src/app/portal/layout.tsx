import type { Viewport } from "next";
import { PortalShell } from "@/components/PortalShell";
import { getPortalContext } from "@/lib/portal-data";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { storageNote } = await getPortalContext();
  return <PortalShell storageNote={storageNote}>{children}</PortalShell>;
}
