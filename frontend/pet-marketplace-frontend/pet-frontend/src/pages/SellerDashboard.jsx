import React, { useEffect, useState } from "react";
import { getMyListings, deletePet } from "../api/pets";
import { resolveImage } from "../api/client";
import { getSellerRatingSummary } from "../api/ratings";
import { useAuth } from "../context/AuthContext.jsx";
import StatusPill from "../components/StatusPill.jsx";
import StarRating from "../components/StarRating.jsx";
import Loading from "../components/Loading.jsx";
import PetFormModal from "./seller/PetFormModal.jsx";
import MarkAdoptedModal from "./seller/MarkAdoptedModal.jsx";
import VaccinationsModal from "./seller/VaccinationsModal.jsx";
import "./Dashboard.css";

export default function SellerDashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [adoptingPet, setAdoptingPet] = useState(null);
  const [vaxPet, setVaxPet] = useState(null);

  function load() {
    setLoading(true);
    getMyListings()
      .then(setListings)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!user?.id) return;
    getSellerRatingSummary(user.id).then(setRatingSummary).catch(() => {});
  }, [user?.id]);

  useEffect(load, []);

  async function handleDelete(pet) {
    if (!confirm(`Delete listing for ${pet.name}? This can't be undone.`)) return;
    await deletePet(pet.id);
    load();
  }

  return (
    <div className="container">
      <div className="dash-head">
        <div>
          <h1>Your listings</h1>
          <p style={{ color: "var(--ink-soft)" }}>Manage the pets you've listed for adoption.</p>
          {ratingSummary && ratingSummary.count > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <StarRating value={Math.round(ratingSummary.average)} size="sm" />
              <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                {Number(ratingSummary.average).toFixed(1)} · {ratingSummary.count} review{ratingSummary.count !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New listing</button>
      </div>

      {loading ? (
        <Loading label="Loading listings" />
      ) : listings.length === 0 ? (
        <div className="empty">
          <h3>No listings yet</h3>
          <p>Create your first listing to start finding this pet a home.</p>
        </div>
      ) : (
        listings.map((pet) => (
          <div className="card listing-row" key={pet.id}>
            {pet.images?.[0] ? (
              <img className="listing-thumb" src={resolveImage(pet.images[0])} alt={pet.name} />
            ) : (
              <div className="listing-thumb" />
            )}
            <div className="listing-info">
              <div className="row" style={{ gap: 8 }}>
                <h3>{pet.name}</h3>
                <StatusPill status={pet.status} />
              </div>
              <div className="listing-meta">
                {pet.breed} · ₹{Number(pet.price).toLocaleString("en-IN")}
                {pet.buyerName ? ` · Buyer: ${pet.buyerName}` : ""}
              </div>
            </div>
            <div className="listing-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setVaxPet(pet)}>Vaccines</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingPet(pet)}>Edit</button>
              {(pet.status === "Available" || pet.status === "Pending") && (
                <button className="btn btn-primary btn-sm" onClick={() => setAdoptingPet(pet)}>Mark adopted</button>
              )}
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(pet)}>Delete</button>
            </div>
          </div>
        ))
      )}

      {showForm && (
        <PetFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
      {editingPet && (
        <PetFormModal pet={editingPet} onClose={() => setEditingPet(null)} onSaved={() => { setEditingPet(null); load(); }} />
      )}
      {adoptingPet && (
        <MarkAdoptedModal pet={adoptingPet} onClose={() => setAdoptingPet(null)} onSaved={() => { setAdoptingPet(null); load(); }} />
      )}
      {vaxPet && <VaccinationsModal pet={vaxPet} onClose={() => setVaxPet(null)} />}
    </div>
  );
}
