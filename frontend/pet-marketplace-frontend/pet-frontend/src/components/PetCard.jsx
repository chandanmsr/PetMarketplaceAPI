import React from "react";
import { Link } from "react-router-dom";
import { resolveImage } from "../api/client";
import StatusPill from "./StatusPill.jsx";
import FavoriteButton from "./FavoriteButton.jsx";
import "./PetCard.css";

export default function PetCard({ pet }) {
  const image = pet.images?.[0] || pet.Images?.[0];
  const distance = pet.distanceKm ?? pet.DistanceKm;

  return (
    <Link to={`/pets/${pet.id}`} state={{ pet }} className="pet-card">
      <div className="pet-card-image">
        {image ? (
          <img src={resolveImage(image)} alt={pet.name} loading="lazy" />
        ) : (
          <div className="pet-card-noimage">No photo</div>
        )}
        {pet.status && pet.status !== "Available" && (
          <div className="pet-card-status">
            <StatusPill status={pet.status} />
          </div>
        )}
        <div className="pet-card-fav">
          <FavoriteButton petId={pet.id} />
        </div>
      </div>
      <div className="pet-card-body">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3>{pet.name}</h3>
          <span className="pet-card-price">₹{Number(pet.price).toLocaleString("en-IN")}</span>
        </div>
        <p className="pet-card-meta">
          {pet.breed} · {pet.age} {pet.age === 1 ? "yr" : "yrs"}
        </p>
        <div className="row pet-card-footer">
          <span className="pet-card-seller">{pet.sellerName || "Unknown seller"}</span>
          {typeof distance === "number" && distance > 0 && (
            <span className="pet-card-distance">{distance.toFixed(1)} km away</span>
          )}
        </div>
      </div>
    </Link>
  );
}
