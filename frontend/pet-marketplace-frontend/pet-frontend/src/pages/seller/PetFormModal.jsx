import React, { useEffect, useState } from "react";
import Modal from "../../components/Modal.jsx";
import ImageUploader from "../../components/ImageUploader.jsx";
import LocationAutocomplete from "../../components/LocationAutocomplete.jsx";
import PetMap from "../../components/PetMap.jsx";
import { createPet, updatePet } from "../../api/pets";

const SPECIES = ["Dog", "Cat", "Bird", "Rabbit", "Fish", "Other"];

function toDateInput(d) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export default function PetFormModal({ pet, onClose, onSaved }) {
  const editing = !!pet;
  const [form, setForm] = useState({
    name: pet?.name || "",
    species: pet?.species || "Dog",
    breed: pet?.breed || "",
    age: pet?.age ?? "",
    price: pet?.price ?? "",
    description: pet?.description || "",
    isVaccinated: pet?.isVaccinated || false,
    lastVaccinationDate: toDateInput(pet?.lastVaccinationDate) || toDateInput(new Date()),
    nextVaccinationDate: toDateInput(pet?.nextVaccinationDate),
    locationDescription: pet?.locationDescription || "",
    latitude: pet?.latitude ?? null,
    longitude: pet?.longitude ?? null,
  });
  const [images, setImages] = useState(pet?.images || []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // On new listing only: auto-detect GPS and reverse-geocode to pre-fill location
  useEffect(() => {
    if (editing) return;                          // don't overwrite on edit
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const label = [
            addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city,
            addr.city || addr.state_district,
            addr.state,
          ]
            .filter(Boolean)
            .slice(0, 3)
            .join(", ");
          setForm((f) => ({
            ...f,
            locationDescription: label || data.display_name?.split(",").slice(0, 3).join(", ") || "",
            latitude,
            longitude,
          }));
        } catch {
          // silently skip — user can type manually
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editing) {
        await updatePet(pet.id, {
          name: form.name,
          species: form.species,
          breed: form.breed,
          age: Number(form.age),
          price: Number(form.price),
          description: form.description,
          isVaccinated: form.isVaccinated,
        });
      } else {
        await createPet({
          ...form,
          age: Number(form.age),
          price: Number(form.price),
          nextVaccinationDate: form.nextVaccinationDate || null,
          imageUrls: images,
        });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save this listing.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={editing ? `Edit ${pet.name}` : "New listing"} onClose={onClose} width={560}>
      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="field-row">
          <div className="field">
            <label>Name</label>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="field">
            <label>Species</label>
            <select value={form.species} onChange={(e) => set("species", e.target.value)}>
              {SPECIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Breed</label>
            <input required value={form.breed} onChange={(e) => set("breed", e.target.value)} />
          </div>
          <div className="field">
            <label>Age (years)</label>
            <input type="number" min="0" required value={form.age} onChange={(e) => set("age", e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>Price (₹)</label>
          <input type="number" min="0" required value={form.price} onChange={(e) => set("price", e.target.value)} />
        </div>

        <div className="field">
          <label>Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>

        <div className="field">
          <label>
            Location
            {locating && (
              <span className="loc-detecting">
                <span className="loc-spinner" style={{ width: 11, height: 11 }} aria-hidden="true" />
                Detecting…
              </span>
            )}
          </label>
          <LocationAutocomplete
            value={form.locationDescription}
            onChange={(label, lat, lon) => {
              set("locationDescription", label);
              set("latitude", lat ?? null);
              set("longitude", lon ?? null);
            }}
          />
          {form.latitude && form.longitude && (
            <div style={{ marginTop: "var(--space-2)" }}>
              <PetMap lat={form.latitude} lon={form.longitude} label={form.locationDescription || "Selected location"} />
            </div>
          )}
        </div>

        {!editing && (
          <>
            <div className="field field-check">
              <input type="checkbox" id="vaccinated" checked={form.isVaccinated} onChange={(e) => set("isVaccinated", e.target.checked)} />
              <label htmlFor="vaccinated" style={{ marginBottom: 0 }}>Already vaccinated</label>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Last vaccination date</label>
                <input type="date" required value={form.lastVaccinationDate} onChange={(e) => set("lastVaccinationDate", e.target.value)} />
              </div>
              <div className="field">
                <label>Next due (optional)</label>
                <input type="date" value={form.nextVaccinationDate} onChange={(e) => set("nextVaccinationDate", e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Photos</label>
              <ImageUploader value={images} onChange={setImages} />
            </div>
          </>
        )}

        {editing && (
          <div className="field field-check">
            <input type="checkbox" id="vaccinated-e" checked={form.isVaccinated} onChange={(e) => set("isVaccinated", e.target.checked)} />
            <label htmlFor="vaccinated-e" style={{ marginBottom: 0 }}>Vaccinated</label>
          </div>
        )}

        <button className="btn btn-primary btn-block" disabled={busy} style={{ marginTop: "var(--space-3)" }}>
          {busy ? "Saving…" : editing ? "Save changes" : "Publish listing"}
        </button>
      </form>
    </Modal>
  );
}
