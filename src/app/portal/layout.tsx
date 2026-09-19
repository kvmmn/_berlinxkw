import { PortalShell } from "@/components/PortalShell";
import { getPortalContext } from "@/lib/portal-data";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { storageNote } = await getPortalContext();
  return <PortalShell storageNote={storageNote}>{children}</PortalShell>;
}
