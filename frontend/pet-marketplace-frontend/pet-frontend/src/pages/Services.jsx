import React, { useEffect, useState } from "react";
import { getServices } from "../api/services";
import Loading from "../components/Loading.jsx";
import "./Services.css";

const TABS = [
  { key: "veterinary", label: "Veterinary" },
  { key: "petcare", label: "Pet care" },
  { key: "pharmacy", label: "Pharmacy" },
  { key: "all", label: "All" },
];

export default function Services() {
  const [tab, setTab] = useState("veterinary");
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(true);
  const [locationError, setLocationError] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Your browser doesn't support location.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError("Location permission is needed to find nearby services.");
        setLocating(false);
      },
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    getServices(tab, coords.latitude, coords.longitude, 10)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [tab, coords]);

  return (
    <div className="container">
      <div className="browse-hero">
        <h1>Nearby pet services</h1>
        <p>Vets, groomers, stores, and pharmacies close to you.</p>
      </div>

      <div className="svc-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`svc-tab${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {locating ? (
        <Loading label="Getting your location" />
      ) : locationError ? (
        <div className="alert alert-info">{locationError}</div>
      ) : loading ? (
        <Loading label="Searching nearby" />
      ) : items.length === 0 ? (
        <div className="empty"><h3>Nothing found nearby</h3><p>Try a different category.</p></div>
      ) : (
        items.map((it, i) => (
          <div className="card svc-item" key={it.id || i}>
            <div>
              <div className="svc-name">{it.name}</div>
              <div className="svc-address">{it.address}</div>
            </div>
            <div className="svc-distance">{it.distanceKm} km</div>
          </div>
        ))
      )}
    </div>
  );
}
