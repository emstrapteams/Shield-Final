import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../intern-api/client";
import EquipmentStatusBadge from "../intern-components/EquipmentStatusBadge";
import Pagination from "../intern-components/Pagination";
import EmptyState from "../intern-components/EmptyState";

const CONTENTS_LABELS = { ready: "Ready", needs_refill: "Needs Refill", needs_attention: "Needs Attention", inactive: "Inactive" };

export default function FirstAidKits() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [facility, setFacility] = useState("");
  const [contentsStatus, setContentsStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await api.get("/first-aid-kits", { search, facility, contentsStatus, page, limit: 10 });
      setItems(data);
      setMeta(meta);
    } catch (err) {
      setError(err.message || "Failed to load first-aid kits.");
    } finally {
      setLoading(false);
    }
  }, [search, facility, contentsStatus]);

  useEffect(() => {
    api.get("/facilities", { limit: 100 }).then(({ data }) => setFacilities(data)).catch((err) => setError(err.message || "Failed to load facilities."));
  }, []);
  useEffect(() => { load(1); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>First-Aid Kits</h1>
          <p className="page-sub">{meta.total} total kit{meta.total === 1 ? "" : "s"}</p>
        </div>
        <Link to="/first-aid-kits/new" className="btn btn-primary">+ Add Kit</Link>
      </div>

      <div className="toolbar">
        <input className="input" placeholder="Search name or location…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={facility} onChange={(e) => setFacility(e.target.value)}>
          <option value="">All facilities</option>
          {facilities.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
        <select className="input" value={contentsStatus} onChange={(e) => setContentsStatus(e.target.value)}>
          <option value="">All contents statuses</option>
          {Object.entries(CONTENTS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading first-aid kits…</div>
      ) : items.length === 0 ? (
        <EmptyState title="No first-aid kits found" message="Try adjusting your filters, or add your first kit." actionLabel="+ Add Kit" onAction={() => navigate("/first-aid-kits/new")} />
      ) : (
        <>
          <table className="table">
            <thead><tr><th>Name</th><th>Facility</th><th>Contents Status</th><th>Refill Needed</th><th>Equipment Status</th></tr></thead>
            <tbody>
              {items.map((k) => (
                <tr key={k._id}>
                  <td><Link to={`/first-aid-kits/${k._id}`} className="row-link">{k.name}</Link><div className="row-sub">{k.location}</div></td>
                  <td>{k.facility?.name || "—"}</td>
                  <td><span className={"badge " + (k.firstAidKit?.contentsStatus === "ready" ? "badge-active" : k.firstAidKit?.contentsStatus === "needs_refill" ? "badge-warn" : "badge-danger")}>{CONTENTS_LABELS[k.firstAidKit?.contentsStatus] || "—"}</span></td>
                  <td>{k.firstAidKit?.refillRequired ? "Yes" : "No"}</td>
                  <td><EquipmentStatusBadge status={k.status} /></td>
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
