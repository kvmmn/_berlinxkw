import { FRAME_FINISHES, FRAME_FINISH_LABELS } from "@/lib/frame-finish";
import type { FrameFinish } from "@/lib/types";

/** SSR finish radios — native behaviour + CSS :has(); no client hydration. */
export function TabloDetailFinishFieldset({
  initialFinish,
  idPrefix = "detail",
}: {
  initialFinish: FrameFinish;
  idPrefix?: string;
}) {
  return (
    <fieldset className="bk-frame-finish-fieldset bk-frame-finish-fieldset--shop">
      <legend className="bk-meta">
        frame finish · <span lang="fa">جنس قاب</span>
      </legend>
      <div className="bk-frame-finish-options" role="radiogroup" aria-label="Frame finish">
        {FRAME_FINISHES.map((finish) => {
          const label = FRAME_FINISH_LABELS[finish];
          const inputId = `${idPrefix}-${finish}`;
          return (
            <label key={finish} className="bk-frame-finish-option" htmlFor={inputId}>
              <input
                id={inputId}
                type="radio"
                name={`${idPrefix}-frame-finish`}
                value={finish}
                defaultChecked={finish === initialFinish}
              />
              <span
                className="bk-frame-finish-swatch"
                style={{ background: label.swatch }}
                aria-hidden
              />
              <span className="bk-frame-finish-label">
                <span>{label.en}</span>
                <span className="bk-frame-finish-label-fa" lang="fa">
                  {label.fa}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
