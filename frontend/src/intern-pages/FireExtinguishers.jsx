import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../intern-api/client";
import EquipmentStatusBadge from "../intern-components/EquipmentStatusBadge";
import Pagination from "../intern-components/Pagination";
import EmptyState from "../intern-components/EmptyState";

export default function FireExtinguishers() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [facility, setFacility] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await api.get("/fire-extinguishers", { search, facility, status, page, limit: 10 });
      setItems(data);
      setMeta(meta);
    } catch (err) {
      setError(err.message || "Failed to load fire extinguishers.");
    } finally {
      setLoading(false);
    }
  }, [search, facility, status]);

  useEffect(() => {
    api.get("/facilities", { limit: 100 }).then(({ data }) => setFacilities(data)).catch((err) => setError(err.message || "Failed to load facilities."));
    api.get("/fire-extinguishers/summary").then(({ data }) => setSummary(data)).catch((err) => setError(err.message || "Failed to load extinguisher summary."));
  }, []);
  useEffect(() => { load(1); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Fire Extinguishers</h1>
          <p className="page-sub">{meta.total} total extinguisher{meta.total === 1 ? "" : "s"}</p>
        </div>
        <Link to="/fire-extinguishers/new" className="btn btn-primary">+ Add Extinguisher</Link>
      </div>

      {summary && (
        <div className="stat-grid">
          <div className="stat-card"><div className="stat-number">{summary.active}</div><div className="stat-label">Active</div></div>
          <div className="stat-card stat-warn"><div className="stat-number">{summary.inspection_due}</div><div className="stat-label">Inspection Due</div></div>
          <div className="stat-card stat-danger"><div className="stat-number">{summary.overdue}</div><div className="stat-label">Overdue</div></div>
          <div className="stat-card stat-danger"><div className="stat-number">{summary.replacement_required}</div><div className="stat-label">Replacement Req.</div></div>
          <div className="stat-card"><div className="stat-number">{summary.inactive}</div><div className="stat-label">Inactive</div></div>
        </div>
      )}

      <div className="toolbar">
        <input className="input" placeholder="Search name or location…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={facility} onChange={(e) => setFacility(e.target.value)}>
          <option value="">All facilities</option>
          {facilities.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inspection_due">Inspection Due</option>
          <option value="overdue">Overdue</option>
          <option value="replacement_required">Replacement Required</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading fire extinguishers…</div>
      ) : items.length === 0 ? (
        <EmptyState title="No fire extinguishers found" message="Try adjusting your filters, or add your first one." actionLabel="+ Add Extinguisher" onAction={() => navigate("/fire-extinguishers/new")} />
      ) : (
        <>
          <table className="table">
            <thead><tr><th>Name</th><th>Facility</th><th>Extinguisher Type</th><th>Expiry</th><th>Status</th></tr></thead>
            <tbody>
              {items.map((e) => (
                <tr key={e._id}>
                  <td><Link to={`/fire-extinguishers/${e._id}`} className="row-link">{e.name}</Link><div className="row-sub">{e.location}</div></td>
                  <td>{e.facility?.name || "—"}</td>
                  <td>{e.fireExtinguisher?.extinguisherType || "—"}</td>
                  <td>{e.fireExtinguisher?.expiryDate ? new Date(e.fireExtinguisher.expiryDate).toLocaleDateString() : "—"}</td>
                  <td><EquipmentStatusBadge status={e.status} /></td>
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
