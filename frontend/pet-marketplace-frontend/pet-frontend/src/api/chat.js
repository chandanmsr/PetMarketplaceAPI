import client from "./client";

export function getConversations() {
  return client.get("/Chat/conversations").then((r) => r.data);
}

export function getMessages(otherUserId, petId) {
  const path = petId
    ? `/Chat/messages/${otherUserId}/${petId}`
    : `/Chat/messages/${otherUserId}`;
  return client.get(path).then((r) => r.data);
}

export function sendMessage(receiverId, content, petId) {
  return client
    .post("/Chat/send", { receiverId, content, petId: petId ?? null })
    .then((r) => r.data);
}

export function getUnreadCount() {
  return client.get("/Chat/unread-count").then((r) => r.data);
}
