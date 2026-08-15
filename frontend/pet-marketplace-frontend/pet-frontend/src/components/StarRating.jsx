import React, { useState } from "react";
import "./StarRating.css";

/**
 * StarRating
 *
 * Props:
 *   value      – current rating (0–5)
 *   onChange   – callback(newValue) — omit to make read-only
 *   size       – "sm" | "md" (default: "md")
 *   showValue  – show numeric value label (default: false)
 */
export default function StarRating({ value = 0, onChange, size = "md", showValue = false }) {
  const [hovered, setHovered] = useState(0);
  const interactive = typeof onChange === "function";
  const display = interactive ? (hovered || value) : value;

  return (
    <span className={`star-rating star-rating-${size}${interactive ? " star-rating-interactive" : ""}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn${display >= star ? " star-filled" : ""}`}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          disabled={!interactive}
          onClick={interactive ? () => onChange(star) : undefined}
          onMouseEnter={interactive ? () => setHovered(star) : undefined}
          onMouseLeave={interactive ? () => setHovered(0) : undefined}
        >
          ★
        </button>
      ))}
      {showValue && value > 0 && (
        <span className="star-value">{Number(value).toFixed(1)}</span>
      )}
    </span>
  );
}
