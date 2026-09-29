"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

function parseAspectRatio(raw: string): number | null {
  const parts = raw
    .trim()
    .split("/")
    .map((p) => Number.parseFloat(p.trim()));
  if (parts.length !== 2 || !parts.every((n) => Number.isFinite(n) && n > 0)) {
    return null;
  }
  return parts[0]! / parts[1]!;
}

function columnCountForWidth(width: number): number {
  if (width >= 1200) return 3;
  if (width >= 640) return 2;
  return 1;
}

/** Sync stacked landscape + portrait media heights so portrait-rail rows have no dead gap. */
export function TabloGalleryGrid({
  className,
  mode,
  railLandscapeAspect,
  children,
}: {
  className: string;
  mode: "default" | "portrait-rail";
  railLandscapeAspect: string | null;
  children: ReactNode;
}) {
  const ref = useRef<HTMLUListElement>(null);

  const syncRailHeights = useCallback(() => {
    const el = ref.current;
    if (!el || mode !== "portrait-rail" || !railLandscapeAspect) {
      if (el) {
        el.style.removeProperty("--bk-rail-landscape-h");
        el.style.removeProperty("--bk-rail-portrait-h");
        el.removeAttribute("data-rail-heights");
      }
      return;
    }

    const aspect = parseAspectRatio(railLandscapeAspect);
    if (!aspect) return;

    const width = el.clientWidth;
    const cols = columnCountForWidth(width);
    if (cols < 2) {
      el.style.removeProperty("--bk-rail-landscape-h");
      el.style.removeProperty("--bk-rail-portrait-h");
      el.removeAttribute("data-rail-heights");
      return;
    }

    const style = getComputedStyle(el);
    const gap = Number.parseFloat(style.rowGap || style.gap) || 0;
    const colWidth = (width - gap * (cols - 1)) / cols;
    const landscapeH = colWidth / aspect;
    const portraitH = landscapeH * 2 + gap;

    el.style.setProperty("--bk-rail-landscape-h", `${landscapeH}px`);
    el.style.setProperty("--bk-rail-portrait-h", `${portraitH}px`);
    el.setAttribute("data-rail-heights", "true");
  }, [mode, railLandscapeAspect]);

  useLayoutEffect(() => {
    syncRailHeights();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => syncRailHeights());
    ro.observe(el);
    return () => ro.disconnect();
  }, [syncRailHeights]);

  const railStyle: CSSProperties | undefined =
    mode === "portrait-rail" && railLandscapeAspect
      ? ({ "--bk-rail-landscape-aspect": railLandscapeAspect } as CSSProperties)
      : undefined;

  return (
    <ul ref={ref} className={className} style={railStyle}>
      {children}
    </ul>
  );
}
