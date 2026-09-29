"use client";

export function TabloAspectFrame({
  aspectRatio,
  className,
  children,
}: {
  aspectRatio: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`bk-aspect-frame ${className ?? ""}`.trim()}
      style={{ aspectRatio }}
      data-aspect={aspectRatio}
    >
      {children}
    </div>
  );
}
