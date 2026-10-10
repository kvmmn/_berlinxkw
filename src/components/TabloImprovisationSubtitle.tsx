import { tabloImprovisationLabel } from "@/lib/tablo-improvisation";
import type { Tablo } from "@/lib/types";

export function TabloImprovisationSubtitle({
  tablo,
  className = "",
}: {
  tablo: Tablo;
  className?: string;
}) {
  const label = tabloImprovisationLabel(tablo);
  if (!label) return null;
  return (
    <p className={`bk-meta bk-tablo-improvisation ${className}`.trim()}>{label}</p>
  );
}
