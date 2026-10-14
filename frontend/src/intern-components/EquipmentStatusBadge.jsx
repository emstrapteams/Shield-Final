import React from "react";

const CONFIG = {
  active: { label: "Active", className: "badge-active" },
  inspection_due: { label: "Inspection Due", className: "badge-warn" },
  overdue: { label: "Overdue", className: "badge-danger" },
  replacement_required: { label: "Replacement Required", className: "badge-danger" },
  inactive: { label: "Inactive", className: "badge-inactive" },
};

export default function EquipmentStatusBadge({ status }) {
  const cfg = CONFIG[status] || { label: status, className: "badge-inactive" };
  return <span className={"badge " + cfg.className}>{cfg.label}</span>;
}
