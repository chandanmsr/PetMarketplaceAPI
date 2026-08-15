import React from "react";

const MAP = {
  Available: { cls: "pill-available", label: "Available" },
  PendingConfirmation: { cls: "pill-pending", label: "Pending" },
  Adopted: { cls: "pill-adopted", label: "Adopted" },
  Pending: { cls: "pill-pending", label: "Pending" },
  Accepted: { cls: "pill-available", label: "Accepted" },
  Rejected: { cls: "pill-rejected", label: "Rejected" },
};

export default function StatusPill({ status }) {
  const entry = MAP[status] || { cls: "pill-adopted", label: status };
  return <span className={`pill ${entry.cls}`}>{entry.label}</span>;
}
