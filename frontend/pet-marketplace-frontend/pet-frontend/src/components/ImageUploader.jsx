import React, { useRef, useState } from "react";
import { uploadImages } from "../api/upload";
import { resolveImage } from "../api/client";

export default function ImageUploader({ value = [], onChange }) {
  const fileRef = useRef();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files) {
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      const urls = await uploadImages(files);
      onChange([...value, ...urls].slice(0, 5));
    } catch {
      setError("Upload failed. Check file type (JPEG/PNG/GIF/WebP) and size (max 5MB).");
    } finally {
      setBusy(false);
    }
  }

  function remove(idx) {
    onChange(value.filter((_, i) => i !== idx));
  }

  const remaining = 5 - value.length;

  return (
    <div>
      {value.length > 0 && (
        <div className="upload-grid">
          {value.map((url, i) => (
            <div className="upload-thumb" key={url}>
              <img src={resolveImage(url)} alt="" />
              <button type="button" onClick={() => remove(i)} aria-label="Remove image">✕</button>
            </div>
          ))}
        </div>
      )}

      {remaining > 0 && (
        <div className="upload-actions">

          {/* File picker — hidden input triggered via ref is fine here
              because capture is NOT set, so the file manager always opens */}
          <button
            type="button"
            className="upload-btn"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {busy ? "Uploading…" : "Upload files"}
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/gif,image/webp"
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
          </button>

          {/* Camera — must use a <label> wrapping the input directly.
              Browsers strip the `capture` attribute when the input is
              triggered programmatically via .click() on a hidden element.
              A <label for> / wrapping label is a genuine user activation
              on the input itself, so `capture` is respected. */}
          <label className={`upload-btn${busy ? " upload-btn-disabled" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Take photo
            {/* visually-hidden, NOT the `hidden` attribute — capture only
                works when the input is reachable in the accessibility tree */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              disabled={busy}
              onChange={(e) => handleFiles(e.target.files)}
              style={{
                position: "absolute",
                width: "1px",
                height: "1px",
                opacity: 0,
                pointerEvents: "none",
              }}
            />
          </label>

          <span className="upload-hint">{remaining} slot{remaining !== 1 ? "s" : ""} left</span>
        </div>
      )}

      {error && <div className="alert alert-error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}
