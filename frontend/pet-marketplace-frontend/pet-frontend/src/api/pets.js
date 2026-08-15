import client from "./client";

export function getPets(params = {}) {
  return client.get("/Pets", { params }).then((r) => r.data);
}

export function getMyListings() {
  return client.get("/Pets/my-listings").then((r) => r.data);
}

export function getMyPets() {
  return client.get("/Pets/my-pets").then((r) => r.data);
}

export function getPendingAdoptions() {
  return client.get("/Pets/pending-adoptions").then((r) => r.data);
}

export function createPet(payload) {
  return client.post("/Pets", payload).then((r) => r.data);
}

export function updatePet(id, payload) {
  return client.put(`/Pets/${id}`, payload).then((r) => r.data);
}

export function deletePet(id) {
  return client.delete(`/Pets/${id}`).then((r) => r.data);
}

export function markAdopted(id, buyerId, finalPrice) {
  return client
    .post(`/Pets/${id}/mark-adopted`, { buyerId, finalPrice })
    .then((r) => r.data);
}

export function confirmAdoption(id) {
  return client.post(`/Pets/${id}/confirm-adoption`).then((r) => r.data);
}

export function rejectAdoption(id) {
  return client.post(`/Pets/${id}/reject-adoption`).then((r) => r.data);
}
