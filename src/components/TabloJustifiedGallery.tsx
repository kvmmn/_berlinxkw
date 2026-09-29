import { planJustifiedGalleryRows, tabloAspectFlexGrow } from "@/lib/tablo-gallery-rows";
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
      {rows.map((row, rowIndex) => (
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
