import * as signalR from "@microsoft/signalr";
import { HUB_URL } from "./client";

let connection = null;

export function getHubConnection() {
  if (connection) return connection;

  const token = localStorage.getItem("token");
  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, { accessTokenFactory: () => localStorage.getItem("token") || "" })
    .withAutomaticReconnect()
    .build();

  return connection;
}

export async function startHubConnection() {
  const conn = getHubConnection();
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    try {
      await conn.start();
    } catch (err) {
      console.warn("SignalR connection failed, falling back to REST-only chat:", err.message);
    }
  }
  return conn;
}

export function stopHubConnection() {
  if (connection) {
    connection.stop();
    connection = null;
  }
}
