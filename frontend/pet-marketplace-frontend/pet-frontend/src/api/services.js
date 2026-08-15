import client from "./client";

const ENDPOINTS = {
  veterinary: "/ServiceProviders/veterinary",
  petcare: "/ServiceProviders/pet-care",
  pharmacy: "/ServiceProviders/pharmacy",
  all: "/ServiceProviders/all",
};

export function getServices(category, latitude, longitude, radiusKm = 10) {
  const path = ENDPOINTS[category] || ENDPOINTS.all;
  return client
    .get(path, { params: { latitude, longitude, radiusKm } })
    .then((r) => r.data);
}
