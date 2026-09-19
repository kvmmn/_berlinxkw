import { DailySummary } from "@/components/DailySummary";
import { getPortalContext } from "@/lib/portal-data";

export default async function DailyPage() {
  const { currentWeek } = await getPortalContext();
  return <DailySummary week={currentWeek} />;
}
