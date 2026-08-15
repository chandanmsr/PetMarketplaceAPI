import React, { useEffect, useRef, useState } from "react";
import "./LocationAutocomplete.css";

// Debounce delay in ms before hitting Nominatim
const DEBOUNCE_MS = 350;

/**
 * LocationAutocomplete
 *
 * Props:
 *   value        – current display string shown in the input
 *   onChange(label, lat, lon) – called when the user picks a suggestion
 *                               OR clears the input (label="", lat/lon undefined)
 *   placeholder  – input placeholder text
 *   required     – HTML required attribute
 */
export default function LocationAutocomplete({ value, onChange, placeholder = "e.g. Koramangala, Bengaluru", required }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Keep local query in sync if parent resets value
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onPointerDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function handleInput(e) {
    const q = e.target.value;
    setQuery(q);

    // Notify parent that the committed value is now dirty / cleared
    if (!q) {
      onChange("", undefined, undefined);
      setSuggestions([]);
      setOpen(false);
    }

    clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => fetchSuggestions(q), DEBOUNCE_MS);
  }

  async function fetchSuggestions(q) {
    setBusy(true);
    try {
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&countrycodes=in`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "en" },
      });
      const data = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  function handleSelect(item) {
    const label = item.display_name
      .split(",")
      .slice(0, 3)
      .map((s) => s.trim())
      .join(", ");
    setQuery(label);
    setSuggestions([]);
    setOpen(false);
    onChange(label, parseFloat(item.lat), parseFloat(item.lon));
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="loc-wrap" ref={wrapperRef}>
      <div className="loc-input-row">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
        />
        {busy && <span className="loc-spinner" aria-hidden="true" />}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="loc-dropdown" role="listbox">
          {suggestions.map((item) => (
            <li
              key={item.place_id}
              role="option"
              className="loc-option"
              onPointerDown={(e) => {
                // pointerdown fires before input blur — prevent focus loss
                e.preventDefault();
                handleSelect(item);
              }}
            >
              <span className="loc-option-name">
                {[item.address?.city || item.address?.town || item.address?.village || item.address?.county, item.address?.state]
                  .filter(Boolean)
                  .join(", ") || item.display_name.split(",").slice(0, 2).join(", ")}
              </span>
              <span className="loc-option-detail">
                {item.address?.state_district || item.address?.state || ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
