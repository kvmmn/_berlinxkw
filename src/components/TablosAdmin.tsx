"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { SHOP_LINK_PLACEHOLDER, fillCaptionDraft, shopListingUrl } from "@/lib/shop-url";
import { MAX_IMAGE_BYTES } from "@/lib/idea-limits";
import type { Tablo, TabloStatus } from "@/lib/types";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
    setImageFile(null);
    if (fileRef.current) fileRef.current.value = "";
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
    setImageFile(null);
    setError(null);
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
    if (imageFile) form.set("image", imageFile);

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
        <code>{SHOP_LINK_PLACEHOLDER}</code> for the live listing URL.
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
        <label className="bk-field">
          <span className="bk-meta">image</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f && f.size > MAX_IMAGE_BYTES) {
                setError("Image must be 8MB or smaller.");
                return;
              }
              setImageFile(f ?? null);
              setError(null);
            }}
          />
        </label>
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
              {t.image?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.image.url} alt="" />
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
