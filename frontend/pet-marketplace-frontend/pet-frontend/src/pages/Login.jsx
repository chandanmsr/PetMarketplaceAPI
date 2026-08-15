import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "Seller" ? "/dashboard/seller" : "/");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't sign in. Check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page auth-page-wide">
      <div className="auth-card-wrap">

        {/* ── Left panel ── */}
        <div className="auth-side-panel">
          <div className="auth-side-logo">Burrow</div>
          <h2 className="auth-side-title">Your pet family<br />awaits you.</h2>
          <p className="auth-side-body">
            Sign in to browse nearby listings, chat with sellers,
            and manage your adoptions — all in one place.
          </p>
          <ul className="auth-side-perks">
            <li><span className="auth-perk-dot" />GPS-based nearby search</li>
            <li><span className="auth-perk-dot" />Real-time buyer–seller chat</li>
            <li><span className="auth-perk-dot" />Vaccination record tracking</li>
            <li><span className="auth-perk-dot" />Verified sellers across India</li>
          </ul>
        </div>

        {/* ── Form panel ── */}
        <div className="card auth-form-panel auth-form-panel--centered">
          <div className="auth-form-head">
            <h1>Welcome back</h1>
            <p className="auth-sub">
              New here? <Link to="/register" className="btn-text">Create a free account</Link>
            </p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <label>Email address</label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Password</label>
              <div className="auth-pass-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-pass-toggle"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button className="btn btn-primary btn-block auth-submit-btn" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="auth-terms">
            By signing in you agree to our{" "}
            <a href="#terms" className="btn-text">Terms of Service</a> and{" "}
            <a href="#privacy" className="btn-text">Privacy Policy</a>.
          </p>
        </div>

      </div>
    </div>
  );
}
