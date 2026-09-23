"use client";

import Link from "next/link";
import { useId, useState } from "react";

export type TabloMediaSlide = "artwork" | "framed";

type TabloDualMediaProps = {
  title: string;
  artworkUrl?: string;
  framedUrl?: string;
  variant: "card" | "detail";
  href?: string;
};

export function TabloDualMedia({
  title,
  artworkUrl,
  framedUrl,
  variant,
  href,
}: TabloDualMediaProps) {
  const dual = Boolean(artworkUrl && framedUrl);
  const slides: { key: TabloMediaSlide; url: string; label: string }[] = [];
  if (artworkUrl) slides.push({ key: "artwork", url: artworkUrl, label: "artwork" });
  if (framedUrl) slides.push({ key: "framed", url: framedUrl, label: "framed sample" });

  const [active, setActive] = useState<0 | 1>(0);
  const rootId = useId();
  const tabId = (i: number) => `${rootId}-tab-${i}`;
  const panelId = (i: number) => `${rootId}-panel-${i}`;

  if (slides.length === 0) {
    return <div className="bk-tablo-media-placeholder bk-meta">no image</div>;
  }

  const showFramedSlot = variant === "detail" && artworkUrl && !framedUrl;

  const viewport = (
    <div
      className={`bk-tablo-media-viewport bk-tablo-media-viewport--${variant}`}
      data-dual={dual ? "true" : undefined}
      data-active={active}
    >
      {slides.map((slide, i) => (
        <figure
          key={slide.key}
          id={panelId(i)}
          role="tabpanel"
          aria-hidden={active !== i}
          aria-labelledby={tabId(i)}
          className="bk-tablo-media-figure"
          data-visible={active === i ? "true" : undefined}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.url}
            alt={`${title} — ${slide.label}`}
            loading={i === 0 ? "lazy" : "lazy"}
            decoding="async"
            draggable={false}
          />
          {variant === "detail" ? (
            <figcaption className="bk-meta bk-tablo-media-caption">{slide.label}</figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );

  const tabs =
    dual && slides.length > 1 ? (
      <div className="bk-tablo-media-tabs" role="tablist" aria-label={`${title} photos`}>
        {slides.map((slide, i) => (
          <button
            key={slide.key}
            type="button"
            role="tab"
            id={tabId(i)}
            aria-selected={active === i}
            aria-controls={panelId(i)}
            className="bk-tablo-media-tab"
            data-active={active === i ? "true" : undefined}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActive(i as 0 | 1);
            }}
          >
            <span className="bk-tablo-media-tab-label">{slide.label}</span>
          </button>
        ))}
      </div>
    ) : null;

  if (variant === "card" && href) {
    return (
      <div
        className="bk-tablo-media bk-tablo-media--card"
        onPointerEnter={dual ? () => setActive(1) : undefined}
        onPointerLeave={dual ? () => setActive(0) : undefined}
      >
        <Link href={href} className="bk-tablo-media-link" aria-label={title}>
          {viewport}
        </Link>
        {tabs}
      </div>
    );
  }

  return (
    <div className={`bk-tablo-media bk-tablo-media--${variant}`}>
      {viewport}
      {tabs}
      {showFramedSlot ? (
        <p className="bk-meta bk-tablo-framed-slot">framed sample — coming soon</p>
      ) : null}
    </div>
  );
}
