import { IdeasInbox } from "@/components/IdeasInbox";
import { withClientMediaUrls } from "@/lib/idea-media";
import { getPortalContext } from "@/lib/portal-data";

export default async function IdeasPage() {
  const { state, storageMode } = await getPortalContext();
  const ideas = [...(state.ideas ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return (
    <IdeasInbox
      initialIdeas={withClientMediaUrls(ideas)}
      readOnly={storageMode === "readonly" || storageMode === "blob-error"}
    />
  );
}
