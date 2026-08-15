import React from "react";
import { Link } from "react-router-dom";
import { useFavorites } from "../context/FavoritesContext.jsx";
import { getPets } from "../api/pets";
import PetCard from "../components/PetCard.jsx";
import Loading from "../components/Loading.jsx";

export default function Favorites() {
  const { ids, toggle } = useFavorites();
  const [pets, setPets] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (ids.length === 0) {
      setPets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getPets()
      .then((all) => {
        // Keep only favorited pets, in saved order
        const byId = Object.fromEntries(all.map((p) => [String(p.id), p]));
        setPets(ids.map((id) => byId[String(id)]).filter(Boolean));
      })
      .finally(() => setLoading(false));
  }, [ids.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container">
      <div style={{ padding: "var(--space-6) 0 var(--space-4)" }}>
        <h1>Saved pets</h1>
        <p style={{ color: "var(--ink-soft)", marginTop: "var(--space-2)" }}>
          Pets you've saved to come back to.
        </p>
      </div>

      {loading ? (
        <Loading label="Loading saved pets" />
      ) : pets.length === 0 ? (
        <div className="empty">
          <h3>No saved pets yet</h3>
          <p>
            Tap the ♡ on any listing to save it here.{" "}
            <Link to="/browse" style={{ color: "var(--accent)", fontWeight: 600 }}>
              Browse pets →
            </Link>
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
