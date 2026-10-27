import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../intern-api/client";
import Pagination from "../intern-components/Pagination";
import EmptyState from "../intern-components/EmptyState";

const STATUS_BADGE = {
  pending: "badge-inactive", in_progress: "badge-warn", completed: "badge-active",
  overdue: "badge-danger", verified: "badge-active",
};

export default function CorrectiveActions() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await api.get("/corrective-actions", {
        search, priority, status: overdueOnly ? "" : status, overdue: overdueOnly ? "true" : "", page, limit: 10,
      });
      setItems(data);
      setMeta(meta);
    } catch (err) {
      setError(err.message || "Failed to load corrective actions.");
    } finally {
      setLoading(false);
    }
  }, [search, priority, status, overdueOnly]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Corrective Actions</h1>
          <p className="page-sub">{meta.total} total action{meta.total === 1 ? "" : "s"}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={() => load(1)} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <Link to="/corrective-actions/new" className="btn btn-primary">+ Add Action</Link>
        </div>
      </div>

      <div className="toolbar">
        <input className="input" placeholder="Search title…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All priorities</option>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
        </select>
        <select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setOverdueOnly(false); }} disabled={overdueOnly}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option><option value="in_progress">In Progress</option>
          <option value="completed">Completed</option><option value="overdue">Overdue</option><option value="verified">Verified</option>
        </select>
        <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} style={{ width: "auto" }} />
          <span>Overdue only</span>
        </label>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading corrective actions…</div>
      ) : items.length === 0 ? (
        <EmptyState title="No corrective actions found" message="Try adjusting your filters, or add your first action." actionLabel="+ Add Action" onAction={() => navigate("/corrective-actions/new")} />
      ) : (
        <>
          <table className="table">
            <thead><tr><th>Title</th><th>Source</th><th>Priority</th><th>Due Date</th><th>Status</th></tr></thead>
            <tbody>
              {items.map((a) => (
                <tr key={a._id}>
                  <td><Link to={`/corrective-actions/${a._id}`} className="row-link">{a.title}</Link></td>
                  <td className="row-sub">{a.sourceType.replace(/_/g, " ")}</td>
                  <td><span className={"priority-tag priority-" + a.priority}>{a.priority}</span></td>
                  <td>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "—"}</td>
                  <td><span className={"badge " + (STATUS_BADGE[a.status] || "badge-inactive")}>{a.status.replace(/_/g, " ")}</span></td>
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
