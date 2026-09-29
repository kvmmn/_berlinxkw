import { tabloAspectFlexGrow } from "@/lib/tablo-gallery-rows";
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
  return (
    <ul className={`bk-tablo-justified-gallery ${className}`.trim()} role="list">
      {items.map((item, index) => (
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
      ))}
    </ul>
  );
}
