import { ShopShell } from "@/components/ShopShell";
import { TabloCard } from "@/components/TabloCard";
import { withPublicTabloImages } from "@/lib/tablo-media";
import { tablosFromState } from "@/lib/tablo-store";
import { loadState } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const { state } = await loadState();
  const tablos = withPublicTabloImages(
    [...tablosFromState(state)]
      .filter((t) => t.status === "listed")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  );

  return (
    <ShopShell meta="original tablos · listed works">
      {tablos.length === 0 ? (
        <p className="bk-shop-empty bk-meta">No listed tablos yet — check back soon.</p>
      ) : (
        <ul className="bk-tablo-grid">
          {tablos.map((tablo) => (
            <li key={tablo.id}>
              <TabloCard tablo={tablo} />
            </li>
          ))}
        </ul>
      )}
    </ShopShell>
  );
}
