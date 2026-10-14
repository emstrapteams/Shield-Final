import React from "react";

export default function EmptyState({ title = "Nothing here yet", message, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">📭</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {actionLabel && (
        <button className="btn btn-primary" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
}
