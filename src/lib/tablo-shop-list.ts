import { tabloArtworkOrientation } from "./tablo-frame-spec.server";
import type { Tablo } from "./types";
import type { TabloOrientation } from "./tablo-frame-spec";

export type TabloWithOrientation = { tablo: Tablo; orientation: TabloOrientation };

export async function tablosWithOrientation(tablos: Tablo[]): Promise<TabloWithOrientation[]> {
  return Promise.all(
    tablos.map(async (tablo) => ({
      tablo,
      orientation: await tabloArtworkOrientation(tablo),
    })),
  );
}
