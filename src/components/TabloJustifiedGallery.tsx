import {
  frameGridCellStageWidthCm,
  frameGridStageAspect,
  TABLO_GRID_STAGE_MARGIN_RATIO,
} from "@/lib/tablo-frame-spec";
import { planJustifiedGalleryRows, rowWidthCmSum } from "@/lib/tablo-gallery-rows";
import { rowMockupHeightFactor } from "@/lib/tablo-frame-spec";
import type { TabloGalleryLayoutItem } from "@/lib/tablo-gallery-order";
import type { CSSProperties, ReactNode } from "react";

export function TabloJustifiedGallery({
  items,
  className = "",
  renderTile,
}: {
  items: TabloGalleryLayoutItem[];
  className?: string;
  renderTile: (item: TabloGalleryLayoutItem, index: number) => ReactNode;
}) {
  const rows = planJustifiedGalleryRows(items);
  let tileIndex = 0;

  return (
    <div className={`bk-tablo-justified-gallery ${className}`.trim()}>
      {rows.map((row) => (
        <ul
          key={row.items.map((i) => i.tablo.id).join("-")}
          className={`bk-tablo-justified-row bk-tablo-justified-row--${row.layout}`}
          style={
            {
              "--bk-row-width-cm-sum": String(rowWidthCmSum(row.items)),
              "--bk-row-cells": String(row.items.length),
              "--bk-row-mockup-h-factor": String(rowMockupHeightFactor(row.items)),
            } as CSSProperties
          }
          role="list"
        >
          {row.items.map((item) => {
            const index = tileIndex++;
            return (
              <li
                key={item.tablo.id}
                className="bk-tablo-justified-cell"
                style={
                  {
                    "--tile-width-grow": String(
                      frameGridCellStageWidthCm(item.orientation, TABLO_GRID_STAGE_MARGIN_RATIO),
                    ),
                    "--tile-aspect-ratio": frameGridStageAspect(item.orientation),
                  } as CSSProperties
                }
              >
                {renderTile(item, index)}
              </li>
            );
          })}
        </ul>
      ))}
    </div>
  );
}
