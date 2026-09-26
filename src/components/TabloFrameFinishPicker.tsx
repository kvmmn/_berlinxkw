"use client";

import { FRAME_FINISH_LABELS, tabloFrameFinishes } from "@/lib/frame-finish";
import type { FrameFinish, Tablo } from "@/lib/types";

export function TabloFrameFinishPicker({
  tablo,
  value,
  onChange,
  idPrefix = "finish",
}: {
  tablo: Tablo;
  value: FrameFinish;
  onChange: (finish: FrameFinish) => void;
  idPrefix?: string;
}) {
  const options = tabloFrameFinishes(tablo);
  if (options.length <= 1) return null;

  return (
    <fieldset className="bk-frame-finish-fieldset">
      <legend className="bk-meta">frame finish · جنس قاب</legend>
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
