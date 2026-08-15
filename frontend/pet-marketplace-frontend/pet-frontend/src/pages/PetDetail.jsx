import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getPets } from "../api/pets";
import { getVaccinations } from "../api/vaccinations";
import { createNegotiation } from "../api/negotiations";
import { resolveImage } from "../api/client";
import { createRating, getSellerRatings, getSellerRatingSummary } from "../api/ratings";
import { useAuth } from "../context/AuthContext.jsx";
import { useFavorites } from "../context/FavoritesContext.jsx";
import Modal from "../components/Modal.jsx";
import Loading from "../components/Loading.jsx";
import StatusPill from "../components/StatusPill.jsx";
import FavoriteButton from "../components/FavoriteButton.jsx";
import StarRating from "../components/StarRating.jsx";
import PetMap from "../components/PetMap.jsx";
import "./PetDetail.css";

export default function PetDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite } = useFavorites();

  const [pet, setPet] = useState(location.state?.pet || null);
  const [loading, setLoading] = useState(!location.state?.pet);
  const [activeImg, setActiveImg] = useState(0);
  const [vax, setVax] = useState([]);
  const [showOffer, setShowOffer] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMsg, setOfferMsg] = useState("");
  const [offerBusy, setOfferBusy] = useState(false);
  const [offerDone, setOfferDone] = useState(false);
  const [error, setError] = useState("");

  // Ratings state
  const [ratingSummary, setRatingSummary] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [showRatings, setShowRatings] = useState(false);
  const [showRateForm, setShowRateForm] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [ratingError, setRatingError] = useState("");

  // The API has no single-pet endpoint, so if we didn't arrive with pet
  // data from the card click, fall back to fetching the full list.
  useEffect(() => {
    if (pet) return;
    setLoading(true);
    getPets()
      .then((all) => {
        const found = all.find((p) => String(p.id) === String(id));
        setPet(found || null);
      })
      .catch(() => setError("Couldn't load this listing."))
      .finally(() => setLoading(false));
  }, [id, pet]);

  useEffect(() => {
    if (!pet) return;
    getVaccinations(pet.id).then(setVax).catch(() => {});
  }, [pet?.id]);

  // Load seller rating summary whenever we know the seller
  useEffect(() => {
    if (!pet?.sellerId) return;
    getSellerRatingSummary(pet.sellerId)
      .then(setRatingSummary)
      .catch(() => setRatingSummary(null));
  }, [pet?.sellerId]);

  async function submitOffer(e) {
    e.preventDefault();
    setOfferBusy(true);
    setError("");
    try {
      await createNegotiation({
        petId: pet.id,
        offeredPrice: Number(offerPrice),
        message: offerMsg || undefined,
      });
      setOfferDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't send your offer.");
    } finally {
      setOfferBusy(false);
    }
  }

  async function loadRatings() {
    if (!pet?.sellerId) return;
    const data = await getSellerRatings(pet.sellerId).catch(() => []);
    setRatings(data);
    setShowRatings(true);
  }

  async function submitRating(e) {
    e.preventDefault();
    if (!myRating) return;
    setRatingBusy(true);
    setRatingError("");
    try {
      await createRating({
        sellerId: pet.sellerId,
        petId: pet.id,
        rating: myRating,
        comment: myComment || undefined,
      });
      setRatingDone(true);
      // Refresh summary
      getSellerRatingSummary(pet.sellerId).then(setRatingSummary).catch(() => {});
    } catch (err) {
      setRatingError(err.response?.data?.message || "Couldn't submit your rating.");
    } finally {
      setRatingBusy(false);
    }
  }

  if (loading) return <div className="container"><Loading label="Loading listing" /></div>;
  if (!pet) return <div className="container empty"><h3>Listing not found</h3></div>;

  const images = pet.images || [];
  const isOwnListing = user && pet.sellerId === user.id;
  const canOffer = user && user.role === "Buyer" && pet.status === "Available";
  // Buyer can rate if they've adopted this pet (status Adopted) and they're the buyer
  const canRate = user && user.role === "Buyer" && pet.status === "Adopted" && !isOwnListing;
  const lat = pet.latitude ?? pet.Latitude;
  const lon = pet.longitude ?? pet.Longitude;

  return (
    <div className="container">
      <div className="pet-detail">
        {/* Left column — gallery + map */}
        <div>
          <div className="pd-gallery-main">
            {images.length > 0 ? (
              <img src={resolveImage(images[activeImg])} alt={pet.name} />
            ) : (
              <div className="pet-card-noimage" style={{ height: "100%" }}>No photo</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="pd-gallery-thumbs">
              {images.map((img, i) => (
                <button key={i} className={i === activeImg ? "active" : ""} onClick={() => setActiveImg(i)}>
                  <img src={resolveImage(img)} alt="" />
                </button>
              ))}
            </div>
          )}

          {/* Map */}
          {lat && lon && (
            <div className="pd-section" style={{ marginTop: "var(--space-5)" }}>
              <h3>Location</h3>
              <PetMap lat={lat} lon={lon} label={pet.locationDescription || pet.name} />
              {pet.locationDescription && (
                <p style={{ marginTop: "var(--space-2)", color: "var(--ink-soft)", fontSize: "0.85rem" }}>
                  📍 {pet.locationDescription}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right column — details */}
        <div>
          <div className="pd-head">
            <div>
              <h1>{pet.name}</h1>
              <p className="pd-meta">{pet.breed} · {pet.species}</p>
            </div>
            <div className="pd-head-actions">
              <StatusPill status={pet.status} />
              <FavoriteButton petId={pet.id} className="pd-fav-btn" />
            </div>
          </div>
          <div className="pd-price">₹{Number(pet.price).toLocaleString("en-IN")}</div>

          <div className="pd-section" style={{ marginTop: "var(--space-5)" }}>
            <div className="pd-facts">
              <div className="pd-fact">
                <div className="pd-fact-label">Age</div>
                <div className="pd-fact-value">{pet.age} {pet.age === 1 ? "year" : "years"}</div>
              </div>
              <div className="pd-fact">
                <div className="pd-fact-label">Vaccinated</div>
                <div className="pd-fact-value">{pet.isVaccinated ? "Yes" : "Not yet"}</div>
              </div>
              {pet.locationDescription && !lat && (
                <div className="pd-fact" style={{ gridColumn: "1 / -1" }}>
                  <div className="pd-fact-label">Location</div>
                  <div className="pd-fact-value">{pet.locationDescription}</div>
                </div>
              )}
            </div>
          </div>

          {pet.description && (
            <div className="pd-section">
              <h3>About {pet.name}</h3>
              <p className="pd-desc">{pet.description}</p>
            </div>
          )}

          {vax.length > 0 && (
            <div className="pd-section">
              <h3>Vaccination history</h3>
              <div className="card" style={{ padding: "0 var(--space-4)" }}>
                {vax.map((v) => (
                  <div className="vax-item" key={v.id}>
                    <span className="vax-name">{v.vaccineName}</span>
                    <span className="vax-date">{new Date(v.vaccinationDate).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seller card with rating */}
          <div className="card pd-seller">
            <div>
              <div style={{ fontWeight: 600 }}>{pet.sellerName}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>Seller</div>
              {ratingSummary && ratingSummary.count > 0 ? (
                <button
                  className="pd-seller-rating"
                  onClick={loadRatings}
                  title="View all reviews"
                >
                  <StarRating value={ratingSummary.average} size="sm" />
                  <span className="pd-seller-rating-text">
                    {Number(ratingSummary.average).toFixed(1)} ({ratingSummary.count} review{ratingSummary.count !== 1 ? "s" : ""})
                  </span>
                </button>
              ) : (
                <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 2 }}>No reviews yet</div>
              )}
            </div>
            <div className="pd-seller-btns">
              {user && !isOwnListing && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate(`/messages?with=${pet.sellerId}&pet=${pet.id}`)}
                >
                  Message seller
                </button>
              )}
              {canRate && (
                <button className="btn btn-ghost btn-sm" onClick={() => setShowRateForm(true)}>
                  Rate seller
                </button>
              )}
            </div>
          </div>

          {!isOwnListing && (
            <div className="pd-actions">
              {canOffer && (
                <button className="btn btn-primary btn-block" onClick={() => setShowOffer(true)}>
                  Make an offer
                </button>
              )}
              {!user && (
                <button className="btn btn-primary btn-block" onClick={() => navigate("/login")}>
                  Sign in to make an offer
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Offer modal */}
      {showOffer && (
        <Modal title={`Offer for ${pet.name}`} onClose={() => { setShowOffer(false); setOfferDone(false); }}>
          {offerDone ? (
            <div>
              <p>Your offer was sent to the seller and a chat has been started.</p>
              <button className="btn btn-primary btn-block" style={{ marginTop: "var(--space-4)" }} onClick={() => navigate(`/messages?with=${pet.sellerId}&pet=${pet.id}`)}>
                Go to conversation
              </button>
            </div>
          ) : (
            <form onSubmit={submitOffer}>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="field">
                <label>Your offer (₹)</label>
                <input type="number" min="1" required value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder={pet.price} />
              </div>
              <div className="field">
                <label>Message (optional)</label>
                <textarea value={offerMsg} onChange={(e) => setOfferMsg(e.target.value)} placeholder="Anything you'd like the seller to know" />
              </div>
              <button className="btn btn-primary btn-block" disabled={offerBusy}>
                {offerBusy ? "Sending…" : "Send offer"}
              </button>
            </form>
          )}
        </Modal>
      )}

      {/* Reviews modal */}
      {showRatings && (
        <Modal title={`Reviews for ${pet.sellerName}`} onClose={() => setShowRatings(false)}>
          {ratingSummary && ratingSummary.count > 0 && (
            <div className="ratings-summary">
              <div className="ratings-avg">{Number(ratingSummary.average).toFixed(1)}</div>
              <div>
                <StarRating value={Math.round(ratingSummary.average)} size="md" />
                <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: 2 }}>
                  Based on {ratingSummary.count} review{ratingSummary.count !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          )}
          <div className="ratings-list">
            {ratings.length === 0 ? (
              <p style={{ color: "var(--ink-soft)", textAlign: "center", padding: "var(--space-4) 0" }}>No reviews yet.</p>
            ) : (
              ratings.map((r) => (
                <div className="rating-item" key={r.id}>
                  <div className="rating-item-head">
                    <StarRating value={r.rating} size="sm" />
                    <span className="rating-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="rating-comment">{r.comment}</p>}
                  {r.buyerName && <div className="rating-author">— {r.buyerName}</div>}
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* Rate seller modal */}
      {showRateForm && (
        <Modal title={`Rate ${pet.sellerName}`} onClose={() => { setShowRateForm(false); setRatingDone(false); }}>
          {ratingDone ? (
            <div style={{ textAlign: "center", padding: "var(--space-4) 0" }}>
              <div style={{ fontSize: "2rem" }}>⭐</div>
              <p style={{ marginTop: "var(--space-3)" }}>Thank you for your review!</p>
            </div>
          ) : (
            <form onSubmit={submitRating}>
              {ratingError && <div className="alert alert-error">{ratingError}</div>}
              <div className="field" style={{ alignItems: "flex-start" }}>
                <label>Your rating</label>
                <StarRating value={myRating} onChange={setMyRating} size="md" />
              </div>
              <div className="field">
                <label>Comment (optional)</label>
                <textarea
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value)}
                  placeholder="Share your experience with this seller…"
                  rows={3}
                />
              </div>
              <button className="btn btn-primary btn-block" disabled={ratingBusy || !myRating}>
                {ratingBusy ? "Submitting…" : "Submit review"}
              </button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
