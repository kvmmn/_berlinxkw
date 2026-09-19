import { WeeklyReport } from "@/components/WeeklyReport";
import { countOpenIdeas } from "@/lib/brain";
import { getPortalContext } from "@/lib/portal-data";

export default async function PortalWeeklyPage() {
  const { state, currentWeek, previousWeek } = await getPortalContext();
  const decisions = state.decisions.filter((d) => d.weekId === currentWeek.id);

  return (
    <WeeklyReport
      week={currentWeek}
      previousWeek={previousWeek}
      decisions={decisions}
      openIdeasCount={countOpenIdeas(state)}
    />
  );
}
