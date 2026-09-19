import { DailySummary } from "@/components/DailySummary";
import { countOpenIdeas } from "@/lib/brain";
import { getPortalContext } from "@/lib/portal-data";

export default async function DailyPage() {
  const { state, currentWeek } = await getPortalContext();
  return <DailySummary week={currentWeek} openIdeasCount={countOpenIdeas(state)} />;
}
