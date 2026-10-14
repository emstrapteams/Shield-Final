import React from "react";

// Generic status badge for the newer modules (sessions, drills, attendance,
// corrective-action-style enums) where the label set varies per entity.
const TONE = {
  active: "badge-active", scheduled: "badge-inactive", assigned: "badge-inactive",
  in_progress: "badge-warn", attended: "badge-warn",
  completed: "badge-active", passed: "badge-active",
  missed: "badge-danger", cancelled: "badge-danger", overdue: "badge-danger", failed: "badge-danger",
  inactive: "badge-inactive", not_integrated: "badge-inactive",
  integrated: "badge-active",
};

export default function SimpleStatusBadge({ status, labelOverride }) {
  const cls = TONE[status] || "badge-inactive";
  const label = labelOverride || (status || "").replace(/_/g, " ");
  return <span className={"badge " + cls}>{label}</span>;
}
