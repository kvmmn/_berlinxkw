"use client";

import { useEffect } from "react";

/** Scrolls the matching room render into view when size radios change (gallery always shows both). */
export function TabloDetailSizeScrollSync() {
  useEffect(() => {
    const grid = document.querySelector(".bk-tablo-detail-grid");
    if (!grid) return;

    const onChange = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.name !== "detail-tablo-size" || target.type !== "radio" || !target.checked) {
        return;
      }
      const figure = document.getElementById(`detail-render-${target.value}`);
      if (!figure) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      figure.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "nearest",
      });
    };

    grid.addEventListener("change", onChange);
    return () => grid.removeEventListener("change", onChange);
  }, []);

  return null;
}
