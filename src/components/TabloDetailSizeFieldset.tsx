import {
  formatShopPriceEur,
  tabloShopSizeById,
  tabloSizeDimensionsForOrientation,
  tabloSizeMatLabel,
  type TabloShopSizeId,
} from "@/lib/tablo-sizes";
import type { TabloOrientation } from "@/lib/tablo-frame-spec";

/** SSR size radios — pairs with finish fieldset via CSS :has(). */
export function TabloDetailSizeFieldset({
  sizeIds,
  orientation,
  initialSize,
  idPrefix = "detail",
}: {
  sizeIds: TabloShopSizeId[];
  orientation: TabloOrientation;
  initialSize: TabloShopSizeId;
  idPrefix?: string;
}) {
  if (sizeIds.length <= 1) return null;

  return (
    <fieldset className="bk-frame-finish-fieldset bk-frame-finish-fieldset--shop bk-tablo-size-fieldset">
      <legend className="bk-meta">
        size · <span lang="fa">اندازه</span>
      </legend>
      <div className="bk-frame-finish-options bk-tablo-size-options" role="radiogroup" aria-label="Size">
        {sizeIds.map((sizeId) => {
          const config = tabloShopSizeById(sizeId);
          const dims = tabloSizeDimensionsForOrientation(sizeId, orientation);
          const mat = tabloSizeMatLabel(sizeId);
          const inputId = `${idPrefix}-size-${sizeId}`;
          return (
            <label key={sizeId} className="bk-frame-finish-option bk-tablo-size-option" htmlFor={inputId}>
              <input
                id={inputId}
                type="radio"
                name={`${idPrefix}-tablo-size`}
                value={sizeId}
                defaultChecked={sizeId === initialSize}
              />
              <span className="bk-tablo-size-option-copy">
                <span className="bk-tablo-size-option-title">
                  {config.label}
                  <span className="bk-text-fa" lang="fa">
                    {" "}
                    · {config.labelFa}
                  </span>
                </span>
                <span className="bk-meta bk-tablo-size-option-meta">
                  {dims.widthCm}×{dims.heightCm} cm · {mat.en}
                  <span className="bk-text-fa" lang="fa">
                    {" "}
                    · {mat.fa}
                  </span>
                  <span aria-hidden="true"> · </span>
                  {formatShopPriceEur(config.priceEur)}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
