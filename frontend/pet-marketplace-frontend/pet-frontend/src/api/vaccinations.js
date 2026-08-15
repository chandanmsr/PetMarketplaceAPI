import client from "./client";

export function getVaccinations(petId) {
  return client.get(`/Vaccinations/pet/${petId}`).then((r) => r.data);
}

export function addVaccination(payload) {
  return client.post("/Vaccinations", payload).then((r) => r.data);
}

export function updateVaccination(id, payload) {
  return client.put(`/Vaccinations/${id}`, payload).then((r) => r.data);
}

export function deleteVaccination(id) {
  return client.delete(`/Vaccinations/${id}`).then((r) => r.data);
}
