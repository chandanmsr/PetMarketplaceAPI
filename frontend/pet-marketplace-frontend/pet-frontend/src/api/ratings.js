import client from "./client";

/**
 * Submit a rating for a seller after adoption.
 * @param {object} payload - { sellerId, petId, rating, comment }
 */
export function createRating(payload) {
  return client.post("/Ratings", payload).then((r) => r.data);
}

/**
 * Get all ratings for a seller.
 * @param {string} sellerId
 */
export function getSellerRatings(sellerId) {
  return client.get(`/Ratings/seller/${sellerId}`).then((r) => r.data);
}

/**
 * Get the average rating summary for a seller.
 * @param {string} sellerId
 */
export function getSellerRatingSummary(sellerId) {
  return client.get(`/Ratings/seller/${sellerId}/summary`).then((r) => r.data);
}
