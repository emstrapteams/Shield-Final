import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../intern-api/client";
import SimpleStatusBadge from "../intern-components/SimpleStatusBadge";
import Pagination from "../intern-components/Pagination";
import EmptyState from "../intern-components/EmptyState";

const TYPE_LABELS = {
  fire_safety: "Fire Safety", first_aid: "First Aid", emergency_response: "Emergency Response",
  industry_specific: "Industry Specific", custom: "Custom",
};

export default function TrainingPrograms() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await api.get("/training-programs", { search, type, status, page, limit: 10 });
      setItems(data);
      setMeta(meta);
    } catch (err) {
      setError(err.message || "Failed to load training programs.");
    } finally {
      setLoading(false);
    }
  }, [search, type, status]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Training Programs</h1>
          <p className="page-sub">{meta.total} program{meta.total === 1 ? "" : "s"}</p>
        </div>
        <Link to="/training-programs/new" className="btn btn-primary">+ Add Program</Link>
      </div>

      <div className="toolbar">
        <input className="input" placeholder="Search program name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading programs…</div>
      ) : items.length === 0 ? (
        <EmptyState title="No training programs found" message="Try adjusting your filters, or add your first program." actionLabel="+ Add Program" onAction={() => navigate("/training-programs/new")} />
      ) : (
        <>
          <table className="table">
            <thead><tr><th>Name</th><th>Type</th><th>Trainer</th><th>Sessions/Year</th><th>Status</th></tr></thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id}>
                  <td><Link to={`/training-programs/${p._id}`} className="row-link">{p.name}</Link></td>
                  <td>{TYPE_LABELS[p.type] || p.type}</td>
                  <td className="row-sub">{p.trainer || "—"}</td>
                  <td>{p.requiredSessionsPerYear}</td>
                  <td><SimpleStatusBadge status={p.status} /></td>
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
