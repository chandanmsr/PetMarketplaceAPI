import React, { useEffect, useState } from "react";
import Modal from "../../components/Modal.jsx";
import { getMyNegotiations } from "../../api/negotiations";
import { markAdopted } from "../../api/pets";

export default function MarkAdoptedModal({ pet, onClose, onSaved }) {
  const [offers, setOffers] = useState([]);
  const [buyerId, setBuyerId] = useState("");
  const [finalPrice, setFinalPrice] = useState(pet.price);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyNegotiations().then((all) => {
      const forPet = all.filter((n) => n.petId === pet.id);
      setOffers(forPet);
      if (forPet.length) {
        setBuyerId(String(forPet[0].buyerId));
        setFinalPrice(forPet[0].offeredPrice);
      }
    });
  }, [pet.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!buyerId) {
      setError("Enter or select a buyer.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await markAdopted(pet.id, Number(buyerId), finalPrice ? Number(finalPrice) : undefined);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't update this listing.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Mark ${pet.name} as adopted`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        {offers.length > 0 ? (
          <div className="field">
            <label>Buyer</label>
            <select value={buyerId} onChange={(e) => {
              setBuyerId(e.target.value);
              const match = offers.find((o) => String(o.buyerId) === e.target.value);
              if (match) setFinalPrice(match.offeredPrice);
            }}>
              {offers.map((o) => (
                <option key={o.buyerId} value={o.buyerId}>
                  {o.buyer?.firstName} {o.buyer?.lastName} — offered ₹{Number(o.offeredPrice).toLocaleString("en-IN")}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="field">
            <label>Buyer's user ID</label>
            <input required value={buyerId} onChange={(e) => setBuyerId(e.target.value)} placeholder="No offers yet — enter buyer ID from chat" />
            <span className="field-hint">No negotiation offers found for this pet yet. You can find the buyer's ID in your Messages.</span>
          </div>
        )}

        <div className="field">
          <label>Final price (₹)</label>
          <input type="number" min="0" value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} />
        </div>

        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Saving…" : "Confirm buyer & notify"}
        </button>
      </form>
    </Modal>
  );
}
