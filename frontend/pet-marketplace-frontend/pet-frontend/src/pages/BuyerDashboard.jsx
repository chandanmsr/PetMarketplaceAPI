import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyPets, getPendingAdoptions, confirmAdoption, rejectAdoption } from "../api/pets";
import { getMyNegotiations } from "../api/negotiations";
import { resolveImage } from "../api/client";
import { useFavorites } from "../context/FavoritesContext.jsx";
import StatusPill from "../components/StatusPill.jsx";
import Loading from "../components/Loading.jsx";
import "./Dashboard.css";

const TABS = [
  { key: "pets", label: "My pets" },
  { key: "pending", label: "Pending confirmations" },
  { key: "offers", label: "My offers" },
  { key: "saved", label: "Saved pets" },
];

export default function BuyerDashboard() {
  const { ids } = useFavorites();
  const [tab, setTab] = useState("pets");
  const [pets, setPets] = useState([]);
  const [pending, setPending] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    Promise.all([getMyPets(), getPendingAdoptions(), getMyNegotiations()])
      .then(([p1, p2, o]) => {
        setPets(p1);
        setPending(p2);
        setOffers(o);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleConfirm(id) {
    await confirmAdoption(id);
    load();
  }
  async function handleReject(id) {
    if (!confirm("Reject this adoption? The listing will go back to available.")) return;
    await rejectAdoption(id);
    load();
  }

  return (
    <div className="container">
      <div className="dash-head">
        <div>
          <h1>Your dashboard</h1>
          <p style={{ color: "var(--ink-soft)" }}>Track your adoptions and offers.</p>
        </div>
      </div>

      <div className="dash-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`dash-tab${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
            {t.key === "pending" && pending.length > 0 && ` (${pending.length})`}
            {t.key === "saved" && ids.length > 0 && ` (${ids.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : tab === "pets" ? (
        pets.length === 0 ? (
          <div className="empty"><h3>No pets yet</h3><p>Adopted pets and their vaccination records will appear here.</p></div>
        ) : (
          pets.map((pet) => (
            <div className="card listing-row" key={pet.id}>
              {pet.images?.[0] ? <img className="listing-thumb" src={resolveImage(pet.images[0])} alt={pet.name} /> : <div className="listing-thumb" />}
              <div className="listing-info">
                <h3>{pet.name}</h3>
                <div className="listing-meta">{pet.breed} · {pet.vaccinations?.length || 0} vaccination record(s)</div>
              </div>
              <StatusPill status={pet.status} />
            </div>
          ))
        )
      ) : tab === "pending" ? (
        pending.length === 0 ? (
          <div className="empty"><h3>Nothing pending</h3><p>When a seller accepts your offer, confirm it here.</p></div>
        ) : (
          pending.map((pet) => (
            <div className="card listing-row" key={pet.id}>
              {pet.images?.[0] ? <img className="listing-thumb" src={resolveImage(pet.images[0])} alt={pet.name} /> : <div className="listing-thumb" />}
              <div className="listing-info">
                <h3>{pet.name}</h3>
                <div className="listing-meta">₹{Number(pet.negotiatedPrice ?? pet.price).toLocaleString("en-IN")} · {pet.seller?.firstName}</div>
              </div>
              <div className="listing-actions">
                <button className="btn btn-primary btn-sm" onClick={() => handleConfirm(pet.id)}>Confirm</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleReject(pet.id)}>Reject</button>
              </div>
            </div>
          ))
        )
      ) : tab === "offers" ? (
        offers.length === 0 ? (
          <div className="empty"><h3>No offers yet</h3><p>Offers you make on listings will show up here.</p></div>
        ) : (
          offers.map((o) => (
            <div className="card listing-row" key={o.id}>
              <div className="listing-info">
                <h3>{o.pet?.name}</h3>
                <div className="listing-meta">You offered ₹{Number(o.offeredPrice).toLocaleString("en-IN")}</div>
              </div>
              <StatusPill status={o.status} />
            </div>
          ))
        )
      ) : (
        /* saved tab */
        <div className="empty">
          <h3>{ids.length === 0 ? "No saved pets" : `${ids.length} saved pet${ids.length !== 1 ? "s" : ""}`}</h3>
          <p>
            {ids.length === 0
              ? "Tap ♡ on any listing to save it."
              : <Link to="/favorites" style={{ color: "var(--accent)", fontWeight: 600 }}>View saved pets →</Link>}
          </p>
        </div>
      )}
    </div>
  );
}
