import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../intern-api/client";
import EquipmentStatusBadge from "../intern-components/EquipmentStatusBadge";
import Pagination from "../intern-components/Pagination";
import EmptyState from "../intern-components/EmptyState";

const CATEGORY_LABELS = {
  fire_safety: "Fire Safety",
  medical: "Medical",
  emergency_infrastructure: "Emergency Infrastructure",
  other: "Other",
};
const TYPE_LABELS = {
  fire_extinguisher: "Fire Extinguisher",
  fire_alarm: "Fire Alarm",
  fire_hydrant: "Fire Hydrant",
  sprinkler: "Sprinkler",
  fire_blanket: "Fire Blanket",
  first_aid_kit: "First-Aid Kit",
  aed: "AED",
  stretcher: "Stretcher",
  emergency_exit: "Emergency Exit",
  emergency_light: "Emergency Light",
  assembly_point: "Assembly Point",
  other: "Other",
};

export default function Equipment() {
  const [items, setItems] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [facility, setFacility] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await api.get("/equipment", { search, facility, category, type, status, page, limit: 10 });
      setItems(data);
      setMeta(meta);
    } catch (err) {
      setError(err.message || "Failed to load equipment.");
    } finally {
      setLoading(false);
    }
  }, [search, facility, category, type, status]);

  useEffect(() => {
    api.get("/facilities", { limit: 100 }).then(({ data }) => setFacilities(data)).catch(() => {});
  }, []);
  useEffect(() => { load(1); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Safety Equipment</h1>
          <p className="page-sub">{meta.total} total item{meta.total === 1 ? "" : "s"}</p>
        </div>
        <Link to="/equipment/new" className="btn btn-primary">+ Add Equipment</Link>
      </div>

      <div className="toolbar">
        <input className="input" placeholder="Search name or location…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={facility} onChange={(e) => setFacility(e.target.value)}>
          <option value="">All facilities</option>
          {facilities.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
        <div className="loading-state">Loading equipment…</div>
      ) : items.length === 0 ? (
        <EmptyState title="No equipment found" message="Try adjusting your filters, or add your first item." actionLabel="+ Add Equipment" onAction={() => (window.location.href = "/equipment/new")} />
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Facility</th>
                <th>Next Inspection</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e._id}>
                  <td><Link to={`/equipment/${e._id}`} className="row-link">{e.name}</Link><div className="row-sub">{e.location}</div></td>
                  <td>{TYPE_LABELS[e.type] || e.type}</td>
                  <td>{e.facility?.name || "—"}</td>
                  <td>{e.nextInspectionDate ? new Date(e.nextInspectionDate).toLocaleDateString() : "—"}</td>
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
