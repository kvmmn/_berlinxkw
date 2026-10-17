import type { ReactNode } from "react";

/** English (LTR) run — keeps mixed-script lines from reordering in RTL contexts. */
export function RunEn({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span dir="ltr" lang="en" className={`bk-run-en ${className}`.trim()}>
      {children}
    </span>
  );
}

/** Persian (RTL) run — secondary copy; use nowrap for short parenthetical labels. */
export function RunFa({
  children,
  className = "",
  nowrap = false,
}: {
  children: ReactNode;
  className?: string;
  nowrap?: boolean;
}) {
  return (
    <span
      dir="rtl"
      lang="fa"
      className={`bk-run-fa bk-text-fa ${nowrap ? "bk-run-fa-nowrap" : ""} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

export function RunSep() {
  return (
    <span aria-hidden="true" className="bk-run-sep">
      {" · "}
    </span>
  );
}
