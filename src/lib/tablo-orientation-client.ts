"use client";

import { useEffect, useState } from "react";
import { orientationFromDimensions, type TabloOrientation } from "./tablo-frame-spec";

/** Client probe via artwork natural size when server detection fails. */
export function useTabloOrientation(
  initial: TabloOrientation,
  probeSrc: string | undefined,
): TabloOrientation {
  const [orientation, setOrientation] = useState<TabloOrientation>(initial);

  useEffect(() => {
    setOrientation(initial);
  }, [initial]);

  useEffect(() => {
    if (!probeSrc) return;
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (cancelled || !img.naturalWidth || !img.naturalHeight) return;
      setOrientation(orientationFromDimensions(img.naturalWidth, img.naturalHeight));
    };
    img.src = probeSrc;
    return () => {
      cancelled = true;
      img.onload = null;
    };
  }, [probeSrc]);

  return orientation;
}
