"use client";

import { frameDimensionsForOrientation, type TabloOrientation } from "@/lib/tablo-frame-spec";

export function TabloOrientedMediaFrame({
  orientation,
  className,
  children,
}: {
  orientation: TabloOrientation;
  className?: string;
  children: React.ReactNode;
}) {
  const { aspectRatio } = frameDimensionsForOrientation(orientation);

  return (
    <div className={className} style={{ aspectRatio }} data-orientation={orientation}>
      {children}
    </div>
  );
}
