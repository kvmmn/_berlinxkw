/** Renders stored copy with flowing wraps; middots bind to the preceding phrase. */
export function TabloDescription({ text }: { text: string }) {
  const segments = text
    .split(/\s*·\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length <= 1) {
    return <p className="bk-tablo-detail-desc">{text}</p>;
  }

  return (
    <p className="bk-tablo-detail-desc">
      {segments.map((segment, index) => (
        <span key={index} className="bk-desc-chunk">
          {segment}
          {index < segments.length - 1 ? "\u00a0· " : ""}
        </span>
      ))}
    </p>
  );
}
