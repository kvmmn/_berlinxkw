"use client";

import { FRAME_FINISHES, FRAME_FINISH_LABELS, tabloFrameFinishes } from "@/lib/frame-finish";
import type { FrameFinish, Tablo } from "@/lib/types";

export function TabloFrameFinishPicker({
  tablo,
  value,
  onChange,
  idPrefix = "finish",
  mode = "admin",
}: {
  tablo: Tablo;
  value: FrameFinish;
  onChange: (finish: FrameFinish) => void;
  idPrefix?: string;
  /** Public shop always offers all three standard finishes. */
  mode?: "shop" | "admin";
}) {
  const options = mode === "shop" ? [...FRAME_FINISHES] : tabloFrameFinishes(tablo);
  if (options.length <= 1) return null;

  return (
    <fieldset
      className={
        mode === "shop" ? "bk-frame-finish-fieldset bk-frame-finish-fieldset--shop" : "bk-frame-finish-fieldset"
      }
    >
      <legend className="bk-meta">
        frame finish · <span lang="fa">جنس قاب</span>
      </legend>
      <div className="bk-frame-finish-options" role="radiogroup" aria-label="Frame finish">
        {options.map((finish) => {
          const label = FRAME_FINISH_LABELS[finish];
          const inputId = `${idPrefix}-${finish}`;
          return (
            <label key={finish} className="bk-frame-finish-option" htmlFor={inputId}>
              <input
                id={inputId}
                type="radio"
                name={`${idPrefix}-frame-finish`}
                value={finish}
                checked={value === finish}
                onChange={() => onChange(finish)}
                suppressHydrationWarning
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
