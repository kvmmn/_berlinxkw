"use client";

import Image from "next/image";
import { useId } from "react";

/**
 * Animated brand mark — neon lime Berlin bear in a morphing liquid orb.
 *
 * Default uses `/public/logo.png` (official mark). For a vector-only build,
 * drop a replacement at `public/brand/logo-mark.svg` and set `variant="svg"`.
 */
export function BrandLogoMark({
  size = 40,
  variant = "png",
  className = "",
  priority = false,
}: {
  size?: number;
  variant?: "png" | "svg";
  className?: string;
  priority?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const gradId = `bkLogoLime-${uid}`;
  const gooId = `bkLogoGoo-${uid}`;
  const dim = `${size}px`;

  return (
    <span
      className={`bk-logo-mark ${className}`.trim()}
      style={{ width: dim, height: dim }}
      aria-hidden={variant === "png" ? true : undefined}
    >
      <span className="bk-logo-mark__liquid" aria-hidden>
        <svg viewBox="0 0 100 100" className="bk-logo-mark__liquid-svg">
          <defs>
            <radialGradient id={gradId} cx="50%" cy="42%" r="55%">
              <stop offset="0%" stopColor="var(--bk-lime)" stopOpacity="0.55" />
              <stop offset="70%" stopColor="var(--bk-lime)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--bk-lime)" stopOpacity="0" />
            </radialGradient>
            <filter id={gooId} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                result="goo"
              />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </defs>
          <g filter={`url(#${gooId})`} className="bk-logo-mark__blobs">
            <ellipse
              className="bk-logo-mark__blob bk-logo-mark__blob--a"
              cx="50"
              cy="52"
              rx="28"
              ry="32"
              fill={`url(#${gradId})`}
            />
            <ellipse
              className="bk-logo-mark__blob bk-logo-mark__blob--b"
              cx="48"
              cy="58"
              rx="22"
              ry="26"
              fill={`url(#${gradId})`}
            />
            <ellipse
              className="bk-logo-mark__blob bk-logo-mark__blob--c"
              cx="54"
              cy="48"
              rx="18"
              ry="22"
              fill={`url(#${gradId})`}
            />
          </g>
        </svg>
      </span>
      {variant === "png" ? (
        <Image
          src="/logo.png"
          alt=""
          width={size}
          height={size}
          className="bk-logo-mark__asset"
          priority={priority}
        />
      ) : (
        <svg viewBox="0 0 100 100" className="bk-logo-mark__asset bk-logo-mark__svg-bear" aria-label="berlin × kawe">
          <circle cx="50" cy="50" r="46" fill="#000" />
          <circle cx="50" cy="50" r="44" fill={`url(#${gradId})`} opacity="0.35" />
          <path
            fill="var(--bk-lime)"
            fillOpacity="0.92"
            d="M38 32c-2 4-1 9 2 12-6 2-10 8-8 14 2 7 9 11 16 10 1 5 5 9 10 9s9-4 10-9c7 1 14-3 16-10 2-6-2-12-8-14 3-3 4-8 2-12-2-5-7-8-12-8-3 0-6 1-8 3-2-2-5-3-8-3-5 0-10 3-12 8zm4 6c1-2 3-3 5-3s4 1 5 3c-3 1-5 3-5 6s-2-5-5-6zm14 0c-1-2-3-3-5-3s-4 1-5 3c3 1 5 3 5 6s2-5 5-6zm-9 22c-4 0-7-2-8-5 3 2 7 3 11 3h2c4 0 8-1 11-3-1 3-4 5-8 5h-8z"
          />
          <path
            fill="#000"
            fillOpacity="0.85"
            d="M44 38h4v6h-4zm12 0h4v6h-4zM46 52c2 1 4 1 6 0v2c-2 1-4 1-6 0v-2z"
          />
        </svg>
      )}
    </span>
  );
}
