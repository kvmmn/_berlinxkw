import { WeeklyReview } from "@/components/WeeklyReview";
import { getPortalContext } from "@/lib/portal-data";

export default async function ReviewPage() {
  const { state, previousWeek } = await getPortalContext();
  if (!previousWeek) {
    return <p>No prior week to review yet.</p>;
  }
  const decisions = state.decisions.filter((d) => d.weekId === previousWeek.id);
  return <WeeklyReview previousWeek={previousWeek} decisions={decisions} />;
}
