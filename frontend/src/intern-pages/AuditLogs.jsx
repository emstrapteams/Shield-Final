import React, { useEffect, useState, useCallback } from "react";
import { api } from "../intern-api/client";
import Pagination from "../intern-components/Pagination";
import EmptyState from "../intern-components/EmptyState";

export default function AuditLogs() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [actorName, setActorName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await api.get("/audit-logs", { action, resourceType, actorName, from, to, page, limit: 20 });
      setItems(data);
      setMeta(meta);
    } catch (err) {
      setError(err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [action, resourceType, actorName, from, to]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Audit Logs</h1>
          <p className="page-sub">{meta.total} log entr{meta.total === 1 ? "y" : "ies"}</p>
        </div>
      </div>

      <div className="toolbar">
        <input className="input" placeholder="Action (e.g. employee_created)" value={action} onChange={(e) => setAction(e.target.value)} />
        <input className="input" placeholder="Resource type (e.g. Employee)" value={resourceType} onChange={(e) => setResourceType(e.target.value)} />
        <input className="input" placeholder="Actor name" value={actorName} onChange={(e) => setActorName(e.target.value)} />
        <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="From" />
        <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} title="To" />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading audit logs…</div>
      ) : items.length === 0 ? (
        <EmptyState title="No audit log entries found" message="Actions like creating an employee or equipment item will appear here." />
      ) : (
        <>
          <table className="table">
            <thead><tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Resource Type</th><th>Resource ID</th></tr></thead>
            <tbody>
              {items.map((l) => (
                <tr key={l._id}>
                  <td className="row-sub">{new Date(l.createdAt).toLocaleString()}</td>
                  <td>{l.actorName}{l.actorRole ? <div className="row-sub">{l.actorRole}</div> : null}</td>
                  <td>{l.action}</td>
                  <td className="row-sub">{l.resourceType}</td>
                  <td className="row-sub">{l.resourceId || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={meta.page} totalPages={meta.totalPages} onChange={load} />
        </>
      )}
    </div>
  );
}
