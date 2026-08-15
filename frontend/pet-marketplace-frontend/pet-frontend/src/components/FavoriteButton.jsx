import React from "react";
import { useFavorites } from "../context/FavoritesContext.jsx";
import "./FavoriteButton.css";

/**
 * FavoriteButton — heart toggle for a pet listing.
 *
 * Props:
 *   petId     – the pet's id
 *   className – optional extra class
 */
export default function FavoriteButton({ petId, className = "" }) {
  const { toggle, isFavorite } = useFavorites();
  const active = isFavorite(petId);

  function handleClick(e) {
    // Prevent the parent Link from navigating when clicking the heart
    e.preventDefault();
    e.stopPropagation();
    toggle(petId);
  }

  return (
    <button
      type="button"
      className={`fav-btn${active ? " fav-btn-active" : ""} ${className}`}
      onClick={handleClick}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      title={active ? "Remove from favorites" : "Save to favorites"}
    >
      {active ? "♥" : "♡"}
    </button>
  );
}
