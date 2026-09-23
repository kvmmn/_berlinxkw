import { TablosAdmin } from "@/components/TablosAdmin";
import { withPortalTabloImages } from "@/lib/tablo-media";
import { getPortalContext } from "@/lib/portal-data";

export default async function TablosPage() {
  const { state, storageMode } = await getPortalContext();
  const tablos = [...(state.tablos ?? [])].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  return (
    <TablosAdmin
      initialTablos={withPortalTabloImages(tablos)}
      readOnly={storageMode === "readonly" || storageMode === "blob-error"}
    />
  );
}
