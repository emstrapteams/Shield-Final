import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../intern-api/client";
import StatusBadge from "../intern-components/StatusBadge";
import Pagination from "../intern-components/Pagination";
import EmptyState from "../intern-components/EmptyState";
import ConfirmDialog from "../intern-components/ConfirmDialog";

export default function Departments() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await api.get("/departments", { search, status, page, limit: 10 });
      setItems(data);
      setMeta(meta);
    } catch (err) {
      setError(err.message || "Failed to load departments.");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => { load(1); }, [load]);

  async function toggleStatus(dept) {
    const next = dept.status === "active" ? "inactive" : "active";
    try {
      await api.patch(`/departments/${dept._id}/status`, { status: next });
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
          <h1>Departments</h1>
          <p className="page-sub">{meta.total} total department{meta.total === 1 ? "" : "s"}</p>
        </div>
        <Link to="/departments/new" className="btn btn-primary">+ Add Department</Link>
      </div>

      <div className="toolbar">
        <input className="input" placeholder="Search department name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading departments…</div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No departments found"
          message="Try adjusting your search, or add your first department."
          actionLabel="+ Add Department"
          onAction={() => navigate("/departments/new")}
        />
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d._id}>
                  <td><Link to={`/departments/${d._id}`} className="row-link">{d.name}</Link></td>
                  <td className="row-sub">{d.description || "—"}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td className="table-actions">
                    <Link to={`/departments/${d._id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                    <button className="btn btn-ghost btn-sm" onClick={() => setConfirmTarget(d)}>
                      {d.status === "active" ? "Deactivate" : "Activate"}
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
        title={confirmTarget?.status === "active" ? "Deactivate department?" : "Activate department?"}
        message={`This will ${confirmTarget?.status === "active" ? "deactivate" : "activate"} ${confirmTarget?.name}.`}
        confirmLabel={confirmTarget?.status === "active" ? "Deactivate" : "Activate"}
        onConfirm={() => toggleStatus(confirmTarget)}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
