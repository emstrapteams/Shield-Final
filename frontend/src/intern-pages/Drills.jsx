import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../intern-api/client";
import SimpleStatusBadge from "../intern-components/SimpleStatusBadge";
import Pagination from "../intern-components/Pagination";
import EmptyState from "../intern-components/EmptyState";

const TYPE_LABELS = { fire: "Fire", evacuation: "Evacuation", medical_emergency: "Medical Emergency", custom: "Custom" };

export default function Drills() {
  const [items, setItems] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [facility, setFacility] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await api.get("/drills", { search, facility, type, status, page, limit: 10 });
      setItems(data);
      setMeta(meta);
    } catch (err) {
      setError(err.message || "Failed to load drills.");
    } finally {
      setLoading(false);
    }
  }, [search, facility, type, status]);

  useEffect(() => {
    api.get("/facilities", { limit: 100 }).then(({ data }) => setFacilities(data)).catch(() => {});
  }, []);
  useEffect(() => { load(1); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Emergency Drills</h1>
          <p className="page-sub">{meta.total} drill{meta.total === 1 ? "" : "s"}</p>
        </div>
        <Link to="/drills/new" className="btn btn-primary">+ Schedule Drill</Link>
      </div>

      <div className="toolbar">
        <input className="input" placeholder="Search drill name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={facility} onChange={(e) => setFacility(e.target.value)}>
          <option value="">All facilities</option>
          {facilities.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading drills…</div>
      ) : items.length === 0 ? (
        <EmptyState title="No drills found" message="Try adjusting your filters, or schedule your first drill." actionLabel="+ Schedule Drill" onAction={() => (window.location.href = "/drills/new")} />
      ) : (
        <>
          <table className="table">
            <thead><tr><th>Name</th><th>Type</th><th>Facility</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {items.map((d) => (
                <tr key={d._id}>
                  <td><Link to={`/drills/${d._id}`} className="row-link">{d.name}</Link></td>
                  <td>{TYPE_LABELS[d.type] || d.type}</td>
                  <td>{d.facility?.name || "—"}</td>
                  <td>{new Date(d.date).toLocaleDateString()}</td>
                  <td><SimpleStatusBadge status={d.status} /></td>
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
