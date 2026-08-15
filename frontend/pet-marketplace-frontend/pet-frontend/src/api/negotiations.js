import client from "./client";

export function createNegotiation(payload) {
  return client.post("/Negotiations", payload).then((r) => r.data);
}

export function getMyNegotiations() {
  return client.get("/Negotiations/my").then((r) => r.data);
}
