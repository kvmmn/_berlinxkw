"use client";

import { useEffect, useState } from "react";
import { orientationFromDimensions, type TabloOrientation } from "./tablo-frame-spec";

/** Client probe via artwork natural size when server detection fails. */
export function useTabloOrientation(
  initial: TabloOrientation,
  probeSrc: string | undefined,
  options?: { trustServer?: boolean },
): TabloOrientation {
  const trustServer = options?.trustServer ?? false;
  const [orientation, setOrientation] = useState<TabloOrientation>(initial);

  useEffect(() => {
    setOrientation(initial);
  }, [initial]);

  useEffect(() => {
    if (trustServer || !probeSrc) return;
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
  }, [probeSrc, trustServer]);

  return orientation;
}
