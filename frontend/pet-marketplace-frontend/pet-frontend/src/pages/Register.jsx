import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Auth.css";

const initial = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phoneNumber: "",
  city: "",
  state: "",
  role: "Buyer",
  shopName: "",
  sellerDescription: "",
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await register(form);
      navigate(user.role === "Seller" ? "/dashboard/seller" : "/");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't create your account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const pwLen = form.password.length;
  const pwStrength = pwLen === 0 ? 0 : pwLen < 6 ? 1 : pwLen < 10 ? 2 : 3;
  const pwLabel = ["", "Too short", "Good", "Strong"][pwStrength];
  const pwColor = ["", "var(--rose)", "var(--amber)", "var(--accent)"][pwStrength];

  return (
    <div className="auth-page auth-page-wide">
      <div className="auth-card-wrap">

        {/* ── Left panel ── */}
        <div className="auth-side-panel">
          <div className="auth-side-logo">Burrow</div>
          <h2 className="auth-side-title">Find or give a<br />forever home.</h2>
          <p className="auth-side-body">
            Join thousands of pet lovers across India. Browse verified listings,
            negotiate fairly, and connect over real-time chat.
          </p>
          <ul className="auth-side-perks">
            <li><span className="auth-perk-dot" />Free to join, always</li>
            <li><span className="auth-perk-dot" />GPS-based nearby search</li>
            <li><span className="auth-perk-dot" />Vaccination record tracking</li>
            <li><span className="auth-perk-dot" />Real-time buyer–seller chat</li>
          </ul>
        </div>

        {/* ── Form panel ── */}
        <div className="card auth-form-panel">
          <div className="auth-form-head">
            <h1>Create your account</h1>
            <p className="auth-sub">Already have one? <Link to="/login" className="btn-text">Sign in</Link></p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Role toggle */}
          <div className="auth-role-group">
            <button
              type="button"
              className={`auth-role-btn${form.role === "Buyer" ? " active" : ""}`}
              onClick={() => set("role", "Buyer")}
            >
              <span className="auth-role-icon">🐾</span>
              <span className="auth-role-label">I'm adopting</span>
              <span className="auth-role-sub">Looking for a pet</span>
            </button>
            <button
              type="button"
              className={`auth-role-btn${form.role === "Seller" ? " active" : ""}`}
              onClick={() => set("role", "Seller")}
            >
              <span className="auth-role-icon">🏪</span>
              <span className="auth-role-label">I'm listing pets</span>
              <span className="auth-role-sub">Seller / breeder</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Name row */}
            <div className="auth-divider-label">Your details</div>
            <div className="field-row">
              <div className="field">
                <label>First name</label>
                <input required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Arjun" />
              </div>
              <div className="field">
                <label>Last name</label>
                <input required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Sharma" />
              </div>
            </div>

            <div className="field">
              <label>Email address</label>
              <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="arjun@example.com" />
            </div>

            <div className="field">
              <label>Password</label>
              <div className="auth-pass-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Min. 6 characters"
                />
                <button type="button" className="auth-pass-toggle" onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
              {form.password && (
                <div className="auth-pw-bar">
                  <div className="auth-pw-track">
                    <div className="auth-pw-fill" style={{ width: `${(pwStrength / 3) * 100}%`, background: pwColor }} />
                  </div>
                  <span className="auth-pw-label" style={{ color: pwColor }}>{pwLabel}</span>
                </div>
              )}
            </div>

            {/* Optional contact */}
            <div className="auth-divider-label">Contact & location <span className="auth-optional">(optional)</span></div>
            <div className="field-row">
              <div className="field">
                <label>Phone</label>
                <input value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div className="field">
                <label>City</label>
                <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Bengaluru" />
              </div>
            </div>

            {/* Seller extras */}
            {form.role === "Seller" && (
              <>
                <div className="auth-divider-label">Seller profile</div>
                <div className="field">
                  <label>Shop / kennel name</label>
                  <input
                    value={form.shopName}
                    onChange={(e) => set("shopName", e.target.value)}
                    placeholder="e.g. Happy Paws Kennel"
                  />
                </div>
                <div className="field">
                  <label>About you <span className="auth-optional">(optional)</span></label>
                  <textarea
                    value={form.sellerDescription}
                    onChange={(e) => set("sellerDescription", e.target.value)}
                    placeholder="Tell buyers about your breeding or rescue practice…"
                    rows={2}
                  />
                </div>
              </>
            )}

            <button className="btn btn-primary btn-block auth-submit-btn" disabled={busy}>
              {busy ? "Creating account…" : `Create ${form.role === "Seller" ? "seller" : ""} account`}
            </button>
          </form>

          <p className="auth-terms">
            By creating an account you agree to our{" "}
            <a href="#terms" className="btn-text">Terms of Service</a> and{" "}
            <a href="#privacy" className="btn-text">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
