import React, { useEffect, useState } from "react";
import Modal from "../../components/Modal.jsx";
import { getVaccinations, addVaccination, deleteVaccination } from "../../api/vaccinations";

const empty = { vaccineName: "", vaccinationDate: "", nextDueDate: "", veterinarianName: "", clinicName: "" };

export default function VaccinationsModal({ pet, onClose }) {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function load() {
    getVaccinations(pet.id).then(setRecords);
  }

  useEffect(load, [pet.id]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await addVaccination({ ...form, petId: pet.id, nextDueDate: form.nextDueDate || null });
      setForm(empty);
      load();
    } catch (err) {
      setError("Couldn't add this record.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    await deleteVaccination(id);
    load();
  }

  return (
    <Modal title={`Vaccinations — ${pet.name}`} onClose={onClose} width={520}>
      {records.length > 0 && (
        <div className="card" style={{ padding: "0 var(--space-4)", marginBottom: "var(--space-5)" }}>
          {records.map((v) => (
            <div className="vax-item" key={v.id}>
              <div>
                <div className="vax-name">{v.vaccineName}</div>
                <div className="vax-date">{new Date(v.vaccinationDate).toLocaleDateString()}</div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ marginBottom: "var(--space-3)" }}>Add a record</h3>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleAdd}>
        <div className="field">
          <label>Vaccine name</label>
          <input required value={form.vaccineName} onChange={(e) => set("vaccineName", e.target.value)} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Date given</label>
            <input type="date" required value={form.vaccinationDate} onChange={(e) => set("vaccinationDate", e.target.value)} />
          </div>
          <div className="field">
            <label>Next due (optional)</label>
            <input type="date" value={form.nextDueDate} onChange={(e) => set("nextDueDate", e.target.value)} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Vet (optional)</label>
            <input value={form.veterinarianName} onChange={(e) => set("veterinarianName", e.target.value)} />
          </div>
          <div className="field">
            <label>Clinic (optional)</label>
            <input value={form.clinicName} onChange={(e) => set("clinicName", e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Adding…" : "Add record"}</button>
      </form>
    </Modal>
  );
}
