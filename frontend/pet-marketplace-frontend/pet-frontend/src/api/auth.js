import client from "./client";

export function login(email, password) {
  return client.post("/Auth/login", { email, password }).then((r) => r.data);
}

export function register(payload) {
  return client.post("/Auth/register", payload).then((r) => r.data);
}
