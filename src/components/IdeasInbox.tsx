"use client";

import { useCallback, useRef, useState } from "react";
import type { IdeaInput, IdeaStatus } from "@/lib/types";
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "@/lib/idea-limits";

const STATUS_LABEL: Record<IdeaStatus, string> = {
  inbox: "inbox",
  queued: "queued",
  used: "used",
  archived: "archived",
};

export function IdeasInbox({
  initialIdeas,
  readOnly,
}: {
  initialIdeas: IdeaInput[];
  readOnly?: boolean;
}) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/ideas");
    if (res.ok) {
      const data = (await res.json()) as { ideas: IdeaInput[] };
      setIdeas(data.ideas);
    }
  }, []);

  const addFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming);
    const next: File[] = [...files];
    for (const file of list) {
      if (file.type.startsWith("image/") && file.size > MAX_IMAGE_BYTES) {
        setError("Image must be 8MB or smaller.");
        return;
      }
      if (file.type.startsWith("video/") && file.size > MAX_VIDEO_BYTES) {
        setError("Video must be 40MB or smaller.");
        return;
      }
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        setError("Only image or video files are allowed.");
        return;
      }
      next.push(file);
    }
    setError(null);
    setFiles(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) {
      setError("Storage is read-only — attach Blob or run locally to save ideas.");
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
    form.set("description", description.trim());
    if (tags.trim()) form.set("tags", tags.trim());
    for (const f of files) form.append("files", f);

    const res = await fetch("/api/ideas", { method: "POST", body: form });
    setSubmitting(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not save idea.");
      return;
    }
    setTitle("");
    setDescription("");
    setTags("");
    setFiles([]);
    await refresh();
  };

  const patchStatus = async (id: string, status: IdeaStatus) => {
    if (readOnly) return;
    const res = await fetch(`/api/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await refresh();
  };

  const remove = async (id: string) => {
    if (readOnly) return;
    if (!confirm("Remove this idea and its media?")) return;
    const res = await fetch(`/api/ideas/${id}`, { method: "DELETE" });
    if (res.ok) await refresh();
  };

  return (
    <div className="bk-ideas-layout">
      <header style={{ marginBottom: "2rem" }}>
        <p className="bk-meta" style={{ color: "var(--bk-gray-70)", margin: "0 0 0.5rem" }}>
          ideas / inbox
        </p>
        <h1 className="bk-display" style={{ fontSize: "var(--bk-size-heading)", margin: "0 0 0.75rem" }}>
          OS input
        </h1>
        <p style={{ color: "var(--bk-gray-70)", maxWidth: "48ch", margin: 0 }}>
          Drop works — images, video, written notes — as primary fuel for the Company Brain. Inbox and
          queued ideas are injected into brain context automatically.
        </p>
      </header>

      {!readOnly ? (
        <form onSubmit={submit} className="bk-panel bk-ideas-form">
          <div
            className="bk-ideas-dropzone"
            data-active={dragOver ? "true" : "false"}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
          >
            <p className="bk-meta" style={{ margin: 0, color: "var(--bk-gray-70)" }}>
              drop image or video here
            </p>
            <p className="bk-meta" style={{ margin: 0, fontSize: "0.75rem", color: "var(--bk-gray-45)" }}>
              images ≤ 8MB · video ≤ 40MB
            </p>
            <div className="bk-ideas-media-actions">
              <button
                type="button"
                className="bk-btn bk-btn-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                choose photo / video
              </button>
              <button
                type="button"
                className="bk-btn"
                onClick={() => cameraInputRef.current?.click()}
              >
                take photo
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
          {files.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1rem", fontSize: "0.75rem" }}>
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span>{f.name}</span>
                  <button
                    type="button"
                    className="bk-btn"
                    style={{ padding: "0.2rem 0.5rem", fontSize: "0.6rem" }}
                    onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  >
                    remove
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <label className="bk-meta" style={{ display: "block", marginBottom: "0.35rem", color: "var(--bk-gray-45)" }}>
            title
          </label>
          <input
            className="bk-input bk-persian"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="working title"
            style={{ marginBottom: "0.75rem" }}
          />

          <label className="bk-meta" style={{ display: "block", marginBottom: "0.35rem", color: "var(--bk-gray-45)" }}>
            description
          </label>
          <textarea
            className="bk-input bk-persian"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="what is this work? context for the brain…"
            rows={4}
            style={{ marginBottom: "0.75rem", resize: "vertical", minHeight: "5rem" }}
          />

          <label className="bk-meta" style={{ display: "block", marginBottom: "0.35rem", color: "var(--bk-gray-45)" }}>
            tags (optional, comma-separated)
          </label>
          <input
            className="bk-input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="mitte, b-roll, story"
            style={{ marginBottom: "1rem" }}
          />

          <div className="bk-ideas-submit-bar">
            {error ? (
              <p style={{ color: "#ff6b6b", fontSize: "0.875rem", margin: 0 }}>{error}</p>
            ) : null}
            <button type="submit" className="bk-btn bk-btn-primary" disabled={submitting}>
              {submitting ? "saving…" : "add to inbox"}
            </button>
          </div>
        </form>
      ) : (
        <p className="bk-meta" style={{ color: "var(--bk-gray-95)", marginBottom: "2rem" }}>
          Read-only mode — ideas cannot be saved until Blob storage is connected.
        </p>
      )}

      {ideas.length === 0 ? (
        <div className="bk-panel" style={{ padding: "2rem", textAlign: "center" }}>
          <p className="bk-meta" style={{ color: "var(--bk-gray-45)", margin: 0 }}>
            inbox empty — add text, image, or video above. the Company Brain reads the latest inbox +
            queued ideas when you chat.
          </p>
        </div>
      ) : (
        <ul className="bk-ideas-grid" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {ideas.map((idea) => (
            <li key={idea.id} className="bk-panel" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <IdeaMediaPreview media={idea.media} />
              <div>
                <span
                  className="bk-meta"
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--bk-gray-95)",
                    border: "1px solid var(--bk-border)",
                    padding: "0.15rem 0.4rem",
                    marginRight: "0.5rem",
                  }}
                >
                  {STATUS_LABEL[idea.status]}
                </span>
                <span className="bk-meta" style={{ fontSize: "0.65rem", color: "var(--bk-gray-45)" }}>
                  {new Date(idea.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h2
                className="bk-persian"
                dir="auto"
                lang="fa"
                style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}
              >
                {idea.title}
              </h2>
              {idea.description ? (
                <p
                  className="bk-persian"
                  dir="auto"
                  lang="fa"
                  style={{ margin: 0, color: "var(--bk-gray-70)", fontSize: "0.9375rem" }}
                >
                  {idea.description}
                </p>
              ) : null}
              {idea.tags?.length ? (
                <p className="bk-meta" style={{ margin: 0, fontSize: "0.65rem", color: "var(--bk-gray-45)" }}>
                  {idea.tags.join(" · ")}
                </p>
              ) : null}
              {!readOnly ? (
                <div className="bk-idea-actions">
                  {idea.status !== "queued" ? (
                    <ActionBtn label="queue" onClick={() => patchStatus(idea.id, "queued")} />
                  ) : null}
                  {idea.status !== "used" ? (
                    <ActionBtn label="used" onClick={() => patchStatus(idea.id, "used")} />
                  ) : null}
                  {idea.status !== "archived" ? (
                    <ActionBtn label="archive" onClick={() => patchStatus(idea.id, "archived")} />
                  ) : null}
                  {idea.status !== "inbox" ? (
                    <ActionBtn label="inbox" onClick={() => patchStatus(idea.id, "inbox")} />
                  ) : null}
                  <ActionBtn label="delete" onClick={() => remove(idea.id)} danger />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className="bk-btn"
      style={{
        borderColor: danger ? "#ff6b6b" : undefined,
        color: danger ? "#ff6b6b" : undefined,
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function IdeaMediaPreview({ media }: { media: IdeaInput["media"] }) {
  const visual = media.find((m) => m.kind === "image" || m.kind === "video");
  if (!visual?.url) {
    return (
      <div
        style={{
          aspectRatio: "16/10",
          background: "#111",
          border: "1px solid var(--bk-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span className="bk-meta" style={{ fontSize: "0.65rem", color: "var(--bk-gray-45)" }}>
          text only
        </span>
      </div>
    );
  }
  if (visual.kind === "video") {
    return (
      <div className="bk-idea-card-media">
        <video src={visual.url} controls playsInline />
      </div>
    );
  }
  return (
    <div className="bk-idea-card-media">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={visual.url} alt="" />
    </div>
  );
}
