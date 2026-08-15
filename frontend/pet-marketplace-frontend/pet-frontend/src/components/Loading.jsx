import React from "react";

export default function Loading({ label = "Loading" }) {
  return (
    <div className="row" style={{ gap: 6, padding: "var(--space-6) 0", justifyContent: "center", color: "var(--ink-soft)" }}>
      <span className="loading-dot" />
      <span>{label}…</span>
    </div>
  );
}
