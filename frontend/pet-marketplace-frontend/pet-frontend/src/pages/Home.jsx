import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Home.css";

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    title: "Browse nearby",
    body: "Filter by species, set a radius, and see exactly how far each pet is from you.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "Offer & negotiate",
    body: "Send a price offer with a message. Sellers respond and you confirm from your dashboard.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Vaccination records",
    body: "See the full vaccine history for every pet before you ever visit the seller.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    title: "Real-time chat",
    body: "Messages arrive instantly. One clean thread per pet — no page refreshes.",
  },
];

const STEPS = [
  { n: "1", title: "Create your account", body: "Sign up as a buyer or seller in under a minute." },
  { n: "2", title: "Find or list a pet", body: "Search by species and location, or post photos and a description." },
  { n: "3", title: "Negotiate & chat", body: "Send a price offer and agree on the details together." },
  { n: "4", title: "Confirm & adopt", body: "Seller marks the pet adopted, you confirm. Done." },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="home-hero">
        <div className="container home-hero-inner">
          <p className="home-eyebrow">India's trusted pet adoption marketplace</p>
          <h1 className="home-h1">Every pet deserves<br />a loving home.</h1>
          <p className="home-lead">
            Burrow connects responsible sellers with caring adopters across India.
            Verified listings, fair negotiation, real-time chat.
          </p>
          <div className="home-hero-actions">
            <Link to="/browse" className="btn btn-primary home-cta-btn">Browse pets</Link>
            {!user && (
              <Link to="/register" className="btn btn-ghost home-cta-btn">List a pet free</Link>
            )}
          </div>

        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section className="home-section container">
        <h2 className="home-section-title">Built for confident adoption</h2>
        <div className="home-features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="home-feature-card">
              <div className="home-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="home-how container">
        <h2 className="home-section-title">How it works</h2>
        <ol className="home-steps">
          {STEPS.map((s) => (
            <li key={s.n} className="home-step">
              <span className="home-step-num">{s.n}</span>
              <strong>{s.title}</strong>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── CTA BAND ──────────────────────────────────────────── */}
      <section className="home-cta-band container">
        <div className="home-cta-band-inner">
          <div>
            <h2>Ready to find your new best friend?</h2>
            <p>Your perfect companion is probably nearby.</p>
          </div>
          <div className="home-cta-band-actions">
            <Link to="/browse" className="btn btn-primary home-cta-btn">Start browsing</Link>
            {!user && <Link to="/register" className="btn btn-ghost home-cta-btn">Create free account</Link>}
          </div>
        </div>
      </section>

    </div>
  );
}
