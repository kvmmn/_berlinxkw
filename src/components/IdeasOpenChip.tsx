import Link from "next/link";

export function IdeasOpenChip({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <Link
      href="/portal/ideas"
      className="bk-meta"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        fontSize: "0.7rem",
        border: "1px solid var(--bk-border)",
        padding: "0.25rem 0.6rem",
        marginBottom: "1rem",
        color: "var(--bk-gray-70)",
      }}
    >
      <span
        style={{
          background: "var(--bk-border)",
          color: "var(--bk-gray-95)",
          padding: "0.1rem 0.35rem",
          fontWeight: 700,
        }}
      >
        {count}
      </span>
      open ideas → inbox
    </Link>
  );
}
