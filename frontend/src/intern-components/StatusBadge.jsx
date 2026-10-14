import React from "react";

export default function StatusBadge({ status }) {
  const isActive = status === "active";
  return (
    <span className={"badge " + (isActive ? "badge-active" : "badge-inactive")}>
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
