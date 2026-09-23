"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { SHOP_LINK_PLACEHOLDER, fillCaptionDraft, shopListingUrl } from "@/lib/shop-url";
import { MAX_IMAGE_BYTES } from "@/lib/idea-limits";
import {
  FRAME_FINISHES,
  FRAME_FINISH_LABELS,
  FRAMED_SAMPLE_ORIENTATION_HINT,
  FRAMED_SAMPLE_ORIENTATION_HINT_FA,
  TABLO_FRAMED_SAMPLE_HELPER_EN,
  TABLO_FRAMED_SAMPLE_HELPER_FA,
  TABLO_PRESENTATION_OVERVIEW_EN,
  TABLO_PRESENTATION_OVERVIEW_FA,
  tabloDefaultFrameFinish,
  tabloFrameFinishes,
} from "@/lib/frame-finish";
import type { FrameFinish, Tablo, TabloStatus } from "@/lib/types";

const STATUS: TabloStatus[] = ["draft", "listed", "sold"];

export function TablosAdmin({
  initialTablos,
  readOnly,
}: {
  initialTablos: Tablo[];
  readOnly?: boolean;
}) {
  const [tablos, setTablos] = useState(initialTablos);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [priceEur, setPriceEur] = useState("");
  const [status, setStatus] = useState<TabloStatus>("draft");
  const [marketplaceUrl, setMarketplaceUrl] = useState("");
  const [captionDraft, setCaptionDraft] = useState("");
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [framedFile, setFramedFile] = useState<File | null>(null);
  const [clearFramed, setClearFramed] = useState(false);
  const [frameFinishes, setFrameFinishes] = useState<FrameFinish[]>([...FRAME_FINISHES]);
  const [defaultFrameFinish, setDefaultFrameFinish] = useState<FrameFinish>("bronze");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const artworkRef = useRef<HTMLInputElement>(null);
  const framedRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/tablos");
    if (res.ok) {
      const data = (await res.json()) as { tablos: Tablo[] };
      setTablos(data.tablos);
    }
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setPriceEur("");
    setStatus("draft");
    setMarketplaceUrl("");
    setCaptionDraft("");
    setArtworkFile(null);
    setFramedFile(null);
    setClearFramed(false);
    setFrameFinishes([...FRAME_FINISHES]);
    setDefaultFrameFinish("bronze");
    if (artworkRef.current) artworkRef.current.value = "";
    if (framedRef.current) framedRef.current.value = "";
  };

  const startEdit = (t: Tablo) => {
    setEditingId(t.id);
    setTitle(t.title);
    setSlug(t.slug);
    setDescription(t.description);
    setPriceEur(String(t.priceEur));
    setStatus(t.status);
    setMarketplaceUrl(t.marketplaceUrl ?? "");
    setCaptionDraft(t.captionDraft ?? "");
    setArtworkFile(null);
    setFramedFile(null);
    setClearFramed(false);
    setFrameFinishes(tabloFrameFinishes(t));
    setDefaultFrameFinish(tabloDefaultFrameFinish(t));
    setError(null);
  };

  const toggleFrameFinish = (finish: FrameFinish, on: boolean) => {
    setFrameFinishes((prev) => {
      let next = on ? [...prev, finish] : prev.filter((f) => f !== finish);
      next = FRAME_FINISHES.filter((f) => next.includes(f));
      if (next.length === 0) return prev;
      if (!next.includes(defaultFrameFinish)) {
        setDefaultFrameFinish(next[0]);
      }
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) {
      setError("Storage is read-only.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const form = new FormData();
    form.set("title", title.trim());
    form.set("slug", slug.trim());
    form.set("description", description.trim());
    form.set("priceEur", priceEur.trim() || "0");
    form.set("status", status);
    form.set("marketplaceUrl", marketplaceUrl.trim());
    form.set(
      "captionDraft",
      captionDraft.trim() || `${title.trim()} · ${SHOP_LINK_PLACEHOLDER}`,
    );
    if (artworkFile) form.set("artwork", artworkFile);
    if (framedFile) form.set("framed", framedFile);
    if (clearFramed) form.set("clearFramed", "true");
    form.set("frameFinishes", JSON.stringify(frameFinishes));
    form.set("defaultFrameFinish", defaultFrameFinish);

    const url = editingId ? `/api/tablos/${editingId}` : "/api/tablos";
    const method = editingId ? "PATCH" : "POST";
    const res = await fetch(url, { method, body: form });
    setSubmitting(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not save tablo.");
      return;
    }
    resetForm();
    await refresh();
  };

  const remove = async (id: string) => {
    if (readOnly || !confirm("Delete this tablo?")) return;
    const res = await fetch(`/api/tablos/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (editingId === id) resetForm();
      await refresh();
    }
  };

  const quickStatus = async (id: string, next: TabloStatus) => {
    if (readOnly) return;
    await fetch(`/api/tablos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    await refresh();
  };

  return (
    <div className="bk-tablos-admin">
      <div className="bk-tablos-admin-head">
        <h1 className="bk-panel-title">tablos shop</h1>
        <Link href="/shop" className="bk-meta bk-btn" target="_blank" rel="noopener noreferrer">
          open public shop ↗
        </Link>
      </div>
      <p className="bk-meta bk-tablos-hint">
        List originals on <code>/shop</code>. Caption drafts use{" "}
        <code>{SHOP_LINK_PLACEHOLDER}</code> for the live listing URL. See{" "}
        <code>docs/tablos-shop-admin.md</code> for artwork vs framed samples and finish slugs.
      </p>

      <form className="bk-panel bk-tablos-form" onSubmit={submit}>
        <h2 className="bk-meta">{editingId ? "edit tablo" : "new tablo"}</h2>
        {error ? <p className="bk-form-error">{error}</p> : null}
        <label className="bk-field">
          <span className="bk-meta">title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="bk-field">
          <span className="bk-meta">slug</span>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto from title" />
        </label>
        <label className="bk-field">
          <span className="bk-meta">description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>
        <label className="bk-field">
          <span className="bk-meta">price (EUR)</span>
          <input
            type="number"
            min={0}
            step={1}
            value={priceEur}
            onChange={(e) => setPriceEur(e.target.value)}
            required
          />
        </label>
        <label className="bk-field">
          <span className="bk-meta">status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as TabloStatus)}>
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="bk-field">
          <span className="bk-meta">marketplace URL (Etsy / external buy)</span>
          <input
            value={marketplaceUrl}
            onChange={(e) => setMarketplaceUrl(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <label className="bk-field">
          <span className="bk-meta">caption draft</span>
          <textarea
            value={captionDraft}
            onChange={(e) => setCaptionDraft(e.target.value)}
            rows={2}
            placeholder={`… ${SHOP_LINK_PLACEHOLDER}`}
          />
        </label>
        <fieldset className="bk-field bk-tablo-presentation">
          <legend className="bk-meta">shop presentation · نمایش فروشگاه</legend>
          <p className="bk-meta bk-tablo-presentation-overview">
            {TABLO_PRESENTATION_OVERVIEW_EN}
            <span lang="fa" className="bk-frame-finish-admin-hint-fa">
              {TABLO_PRESENTATION_OVERVIEW_FA}
            </span>
          </p>
          <label className="bk-field bk-tablo-presentation-artwork">
            <span className="bk-meta">1 · artwork image (flat original → `image`)</span>
            <input
              ref={artworkRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && f.size > MAX_IMAGE_BYTES) {
                  setError("Image must be 8MB or smaller.");
                  return;
                }
                setArtworkFile(f ?? null);
                setError(null);
              }}
            />
          </label>
          <div className="bk-frame-finish-admin bk-tablo-presentation-finishes">
            <p className="bk-meta bk-tablo-presentation-step">2 · frame finishes (buyer options → JSON)</p>
          <p className="bk-meta bk-frame-finish-admin-hint">
            Check which metals buyers can order. Stored as <code>frameFinishes</code> and{" "}
            <code>defaultFrameFinish</code> — not caption text.
          </p>
          <div className="bk-frame-finish-admin-checks">
            {FRAME_FINISHES.map((finish) => {
              const label = FRAME_FINISH_LABELS[finish];
              const checked = frameFinishes.includes(finish);
              return (
                <label key={finish} className="bk-frame-finish-admin-check">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={checked && frameFinishes.length === 1}
                    onChange={(e) => toggleFrameFinish(finish, e.target.checked)}
                  />
                  <span>
                    {label.en} · <span lang="fa">{label.fa}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <label className="bk-field bk-frame-finish-default">
            <span className="bk-meta">default finish · پیش‌فرض</span>
            <select
              value={defaultFrameFinish}
              onChange={(e) => setDefaultFrameFinish(e.target.value as FrameFinish)}
            >
              {frameFinishes.map((finish) => (
                <option key={finish} value={finish}>
                  {FRAME_FINISH_LABELS[finish].en} · {FRAME_FINISH_LABELS[finish].fa}
                </option>
              ))}
            </select>
          </label>
          </div>
          <label className="bk-field bk-tablo-presentation-framed">
            <span className="bk-meta">3 · framed sample (on wall → `framedImage`)</span>
            <p className="bk-meta bk-frame-finish-admin-hint">
              {TABLO_FRAMED_SAMPLE_HELPER_EN}
              <span lang="fa" className="bk-frame-finish-admin-hint-fa">
                {TABLO_FRAMED_SAMPLE_HELPER_FA}
              </span>
              {FRAMED_SAMPLE_ORIENTATION_HINT}
              <span lang="fa" className="bk-frame-finish-admin-hint-fa">
                {FRAMED_SAMPLE_ORIENTATION_HINT_FA}
              </span>
            </p>
            <input
              ref={framedRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && f.size > MAX_IMAGE_BYTES) {
                  setError("Image must be 8MB or smaller.");
                  return;
                }
                setFramedFile(f ?? null);
                setClearFramed(false);
                setError(null);
              }}
            />
            {editingId && tablos.find((x) => x.id === editingId)?.framedImage?.url ? (
              <label className="bk-tablo-clear-framed">
                <input
                  type="checkbox"
                  checked={clearFramed}
                  onChange={(e) => {
                    setClearFramed(e.target.checked);
                    if (e.target.checked) setFramedFile(null);
                  }}
                />
                <span className="bk-meta">remove current framed sample</span>
              </label>
            ) : null}
          </label>
        </fieldset>
        <div className="bk-tablos-form-actions">
          <button type="submit" className="bk-btn bk-btn-primary" disabled={submitting || readOnly}>
            {submitting ? "saving…" : editingId ? "update" : "create"}
          </button>
          {editingId ? (
            <button type="button" className="bk-btn" onClick={resetForm}>
              cancel
            </button>
          ) : null}
        </div>
      </form>

      <ul className="bk-tablos-list">
        {tablos.map((t) => (
          <li key={t.id} className="bk-panel bk-tablo-row">
            <div className="bk-tablo-row-media">
              {t.image?.url || t.framedImage?.url ? (
                <div className="bk-tablo-row-thumbs">
                  {t.image?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.image.url} alt="" title="artwork" />
                  ) : (
                    <div className="bk-tablo-thumb-empty bk-meta">artwork —</div>
                  )}
                  {t.framedImage?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.framedImage.url} alt="" title="framed" />
                  ) : (
                    <div className="bk-tablo-thumb-empty bk-meta">framed —</div>
                  )}
                </div>
              ) : (
                <div className="bk-tablo-card-placeholder bk-meta">—</div>
              )}
            </div>
            <div className="bk-tablo-row-body">
              <div className="bk-tablo-row-head">
                <strong>{t.title}</strong>
                <span className="bk-meta">/{t.slug}</span>
                <span className="bk-meta"> · {t.status}</span>
              </div>
              <p className="bk-meta">
                €{t.priceEur}
                {t.status === "listed" ? (
                  <>
                    {" "}
                    ·{" "}
                    <Link href={`/shop/${t.slug}`} target="_blank" rel="noopener noreferrer">
                      shop link
                    </Link>
                  </>
                ) : null}
              </p>
              {t.captionDraft ? (
                <p className="bk-meta bk-tablo-caption-preview">
                  {fillCaptionDraft(t.captionDraft, t.slug)}
                </p>
              ) : null}
              <p className="bk-meta bk-tablo-listing-url">{shopListingUrl(t.slug)}</p>
              <div className="bk-tablo-row-actions">
                <button type="button" className="bk-btn" onClick={() => startEdit(t)} disabled={readOnly}>
                  edit
                </button>
                {t.status !== "listed" ? (
                  <button
                    type="button"
                    className="bk-btn"
                    onClick={() => quickStatus(t.id, "listed")}
                    disabled={readOnly}
                  >
                    list
                  </button>
                ) : null}
                <button type="button" className="bk-btn" onClick={() => remove(t.id)} disabled={readOnly}>
                  delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
