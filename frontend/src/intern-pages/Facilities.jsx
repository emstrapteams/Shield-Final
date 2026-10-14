import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../intern-api/client";
import StatusBadge from "../intern-components/StatusBadge";
import Pagination from "../intern-components/Pagination";
import EmptyState from "../intern-components/EmptyState";
import ConfirmDialog from "../intern-components/ConfirmDialog";

export default function Facilities() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await api.get("/facilities", { search, city, status, page, limit: 10 });
      setItems(data);
      setMeta(meta);
    } catch (err) {
      setError(err.message || "Failed to load facilities.");
    } finally {
      setLoading(false);
    }
  }, [search, city, status]);

  useEffect(() => { load(1); }, [load]);

  async function toggleStatus(fac) {
    const next = fac.status === "active" ? "inactive" : "active";
    try {
      await api.patch(`/facilities/${fac._id}/status`, { status: next });
      setConfirmTarget(null);
      load(meta.page);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Facilities</h1>
          <p className="page-sub">{meta.total} total facilit{meta.total === 1 ? "y" : "ies"}</p>
        </div>
        <Link to="/facilities/new" className="btn btn-primary">+ Add Facility</Link>
      </div>

      <div className="toolbar">
        <input className="input" placeholder="Search facility name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <input className="input" placeholder="Filter by city…" value={city} onChange={(e) => setCity(e.target.value)} />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading facilities…</div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No facilities found"
          message="Try adjusting your search or filters, or add your first facility."
          actionLabel="+ Add Facility"
          onAction={() => (window.location.href = "/facilities/new")}
        />
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f._id}>
                  <td><Link to={`/facilities/${f._id}`} className="row-link">{f.name}</Link></td>
                  <td className="row-sub">{[f.city, f.state, f.country].filter(Boolean).join(", ") || "—"}</td>
                  <td><StatusBadge status={f.status} /></td>
                  <td className="table-actions">
                    <Link to={`/facilities/${f._id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                    <button className="btn btn-ghost btn-sm" onClick={() => setConfirmTarget(f)}>
                      {f.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={meta.page} totalPages={meta.totalPages} onChange={load} />
        </>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.status === "active" ? "Deactivate facility?" : "Activate facility?"}
        message={`This will ${confirmTarget?.status === "active" ? "deactivate" : "activate"} ${confirmTarget?.name}.`}
        confirmLabel={confirmTarget?.status === "active" ? "Deactivate" : "Activate"}
        onConfirm={() => toggleStatus(confirmTarget)}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
