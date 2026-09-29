"use client";

import { useEffect, useState } from "react";
import { aspectRatioFromDimensions } from "./tablo-aspect";

export function useTabloImageAspect(
  initialAspect: string,
  probeSrc: string | undefined,
  options?: { trustServer?: boolean },
): string {
  const trustServer = options?.trustServer ?? false;
  const [aspect, setAspect] = useState(initialAspect);

  useEffect(() => {
    setAspect(initialAspect);
  }, [initialAspect]);

  useEffect(() => {
    if (trustServer || !probeSrc) return;
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (cancelled || !img.naturalWidth || !img.naturalHeight) return;
      setAspect(aspectRatioFromDimensions(img.naturalWidth, img.naturalHeight));
    };
    img.src = probeSrc;
    return () => {
      cancelled = true;
      img.onload = null;
    };
  }, [probeSrc, trustServer]);

  return aspect;
}
