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
    <div className={className} style={{ aspectRatio }} data-aspect={aspectRatio}>
      {children}
    </div>
  );
}
