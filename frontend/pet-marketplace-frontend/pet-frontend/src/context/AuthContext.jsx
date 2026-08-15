import React, { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "../api/auth";
import { startHubConnection, stopHubConnection } from "../api/signalr";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [ready, setReady] = useState(true);

  useEffect(() => {
    if (user) {
      startHubConnection();
    }
    return () => stopHubConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  function persist(token, userData) {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }

  async function login(email, password) {
    const data = await authApi.login(email, password);
    persist(data.token, data.user);
    return data.user;
  }

  async function register(payload) {
    const data = await authApi.register(payload);
    persist(data.token, data.user);
    return data.user;
  }

  function logout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    stopHubConnection();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout, isSeller: user?.role === "Seller" }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
