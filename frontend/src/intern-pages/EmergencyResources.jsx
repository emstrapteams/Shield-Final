import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../intern-api/client";
import SimpleStatusBadge from "../intern-components/SimpleStatusBadge";
import Pagination from "../intern-components/Pagination";
import EmptyState from "../intern-components/EmptyState";

const SERVICE_LABELS = {
  security_team: "Security Team", safety_team: "Safety Team", first_responders: "First Responders",
  company_ambulance: "Company Ambulance", emergency_contact: "Emergency Contact",
  ambulance_provider: "Ambulance Provider", hospital: "Hospital",
  fire_response_provider: "Fire Response Provider", other_emergency_service: "Other Emergency Service",
};

export default function EmergencyResources() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await api.get("/emergency-resources", { search, category, status, page, limit: 10 });
      setItems(data);
      setMeta(meta);
    } catch (err) {
      setError(err.message || "Failed to load emergency resources.");
    } finally {
      setLoading(false);
    }
  }, [search, category, status]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Emergency Resources</h1>
          <p className="page-sub">Configuration only — {meta.total} resource{meta.total === 1 ? "" : "s"} on file</p>
        </div>
        <Link to="/emergency-resources/new" className="btn btn-primary">+ Add Resource</Link>
      </div>

      <div className="toolbar">
        <input className="input" placeholder="Search name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          <option value="internal">Internal</option>
          <option value="external">External</option>
        </select>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading resources…</div>
      ) : items.length === 0 ? (
        <EmptyState title="No emergency resources found" message="Try adjusting your filters, or add your first resource." actionLabel="+ Add Resource" onAction={() => navigate("/emergency-resources/new")} />
      ) : (
        <>
          <table className="table">
            <thead><tr><th>Name</th><th>Type</th><th>Category</th><th>Coverage</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>
              {items.map((r) => (
                <tr key={r._id}>
                  <td><Link to={`/emergency-resources/${r._id}`} className="row-link">{r.name}</Link><div className="row-sub">{r.contact?.phone || "—"}</div></td>
                  <td>{SERVICE_LABELS[r.serviceType] || r.serviceType}</td>
                  <td className="row-sub">{r.category}</td>
                  <td className="row-sub">{r.coverageArea || "—"}</td>
                  <td>{r.priority}</td>
                  <td><SimpleStatusBadge status={r.status} /></td>
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
