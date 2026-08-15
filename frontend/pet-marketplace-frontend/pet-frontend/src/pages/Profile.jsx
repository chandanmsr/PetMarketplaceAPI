import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import "./Auth.css";

export default function Profile() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="container" style={{ maxWidth: 520, paddingTop: "var(--space-6)", paddingBottom: "var(--space-8)" }}>
      <h1>Your profile</h1>
      <div className="card" style={{ padding: "var(--space-5)", marginTop: "var(--space-5)" }}>
        <div className="field">
          <label>Name</label>
          <p>{user.firstName} {user.lastName}</p>
        </div>
        <div className="field">
          <label>Email</label>
          <p>{user.email}</p>
        </div>
        <div className="field">
          <label>Role</label>
          <p>
            {user.role}
            {user.role === "Seller" && user.isVerifiedSeller && (
              <span className="pill pill-available" style={{ marginLeft: 8 }}>Verified seller</span>
            )}
          </p>
        </div>
        {user.shopName && (
          <div className="field">
            <label>Shop name</label>
            <p>{user.shopName}</p>
          </div>
        )}
        <button className="btn btn-danger" onClick={logout} style={{ marginTop: "var(--space-3)" }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
