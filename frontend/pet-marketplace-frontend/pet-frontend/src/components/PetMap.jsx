import React, { useEffect, useRef } from "react";
import "./PetMap.css";

/**
 * PetMap — renders a Leaflet map centred on a pet's lat/lon.
 * Uses vanilla Leaflet to avoid react-leaflet peer dep issues.
 *
 * Props:
 *   lat, lon  – coordinates
 *   label     – popup label text
 */
export default function PetMap({ lat, lon, label }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!lat || !lon) return;
    if (typeof window === "undefined") return;

    // Dynamically load Leaflet CSS if not already present
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    let map;
    // Small delay to ensure Leaflet CSS is applied before init
    const init = async () => {
      const L = (await import("leaflet")).default;

      // Fix default marker icon path broken by bundlers
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!containerRef.current) return;

      // Remove previous map instance if any
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: false }).setView(
        [lat, lon],
        13
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      L.marker([lat, lon])
        .addTo(map)
        .bindPopup(label || "Pet location")
        .openPopup();

      mapRef.current = map;
    };

    init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lon, label]);

  if (!lat || !lon) return null;

  return (
    <div className="pet-map-wrapper">
      <div ref={containerRef} className="pet-map-container" />
    </div>
  );
}
