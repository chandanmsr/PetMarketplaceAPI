import React, { useEffect, useState } from "react";
import { getPets } from "../api/pets";
import PetCard from "../components/PetCard.jsx";
import Loading from "../components/Loading.jsx";
import LocationAutocomplete from "../components/LocationAutocomplete.jsx";
import "./Browse.css";

const SPECIES = ["", "Dog", "Cat", "Bird", "Rabbit", "Fish", "Other"];

/** Haversine distance in km between two lat/lon pairs */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Browse() {
  const [allPets, setAllPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [species, setSpecies] = useState("");
  const [radiusKm, setRadiusKm] = useState(50);
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);

  function toggleMyLocation() {
    // Second press → clear location and show all pets
    if (coords) {
      setCoords(null);
      return;
    }
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Reverse-geocode so the text input shows a human-readable label
        let label = "";
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          label = [
            addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city,
            addr.city || addr.state_district,
            addr.state,
          ]
            .filter(Boolean)
            .slice(0, 3)
            .join(", ");
        } catch {
          // silently skip — coords still work without label
        }
        setCoords({ latitude, longitude, label });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  // Fetch from backend whenever species changes (location filtering is done client-side)
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getPets({ species: species || undefined })
      .then((data) => active && setAllPets(data))
      .catch(() => active && setError("Couldn't load listings. Is the API running?"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [species]);

  // Client-side radius filter: when coords are set, keep only pets that
  // have coordinates AND fall within the chosen radius. Pets with no stored
  // lat/lon are excluded when a location preference is active.
  const pets = coords
    ? allPets.filter((pet) => {
        const lat = pet.latitude ?? pet.Latitude;
        const lon = pet.longitude ?? pet.Longitude;
        if (lat == null || lon == null) return false;
        return haversineKm(coords.latitude, coords.longitude, lat, lon) <= radiusKm;
      })
    : allPets;

  return (
    <div className="container">
      <div className="browse-hero">
        <h1>Find your next companion</h1>
        <p>Browse pets listed by verified sellers near you.</p>
      </div>

      <div className="filter-bar">
        <select value={species} onChange={(e) => setSpecies(e.target.value)}>
          {SPECIES.map((s) => (
            <option key={s} value={s}>
              {s || "All species"}
            </option>
          ))}
        </select>

        <div className="filter-location">
          <LocationAutocomplete
            value={coords?.label || ""}
            placeholder="Search by city or area…"
            onChange={(label, lat, lon) => {
              if (lat && lon) {
                setCoords({ latitude: lat, longitude: lon, label });
              } else {
                setCoords(null);
              }
            }}
          />
          <button
            className={`locate-btn${coords ? " active" : ""}`}
            onClick={toggleMyLocation}
            title={coords ? "Clear location filter" : "Use my GPS location"}
          >
            {locating ? "…" : "📍"}
          </button>
        </div>

        {coords && (
          <label className="radius-label">
            Within
            <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))}>
              {[5, 10, 25, 50, 100].map((r) => (
                <option key={r} value={r}>
                  {r} km
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <Loading label="Fetching pets" />
      ) : pets.length === 0 ? (
        <div className="empty">
          <h3>No pets match yet</h3>
          <p>
            {coords
              ? "No listings with a saved location fall within this radius. Try widening the radius or clearing the location filter."
              : "Try a different species or add a location filter."}
          </p>
        </div>
      ) : (
        <div className="pet-grid">
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}
    </div>
  );
}
