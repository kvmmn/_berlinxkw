import {
  planJustifiedGalleryRows,
  rowAspectSum,
  tabloAspectFlexGrow,
} from "@/lib/tablo-gallery-rows";
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
  const firstFull = rows.find((row) => row.layout === "full");
  const galleryStyle = firstFull
    ? ({
        "--bk-ref-aspect-sum": String(rowAspectSum(firstFull.items)),
        "--bk-ref-cells": String(firstFull.items.length),
      } as CSSProperties)
    : undefined;
  let tileIndex = 0;

  return (
    <div
      className={`bk-tablo-justified-gallery ${className}`.trim()}
      style={galleryStyle}
    >
      {rows.map((row) => (
        <ul
          key={row.items.map((i) => i.tablo.id).join("-")}
          className={`bk-tablo-justified-row bk-tablo-justified-row--${row.layout}`}
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
                    "--tile-aspect-grow": String(tabloAspectFlexGrow(item.productAspect)),
                    "--tile-aspect-ratio": item.productAspect.replace(/\s+/g, " "),
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
