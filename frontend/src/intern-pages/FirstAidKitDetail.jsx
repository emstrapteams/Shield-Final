import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../intern-api/client";
import EquipmentStatusBadge from "../intern-components/EquipmentStatusBadge";

const CONTENTS_LABELS = { ready: "Ready", needs_refill: "Needs Refill", needs_attention: "Needs Attention", inactive: "Inactive" };

export default function FirstAidKitDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([api.get(`/first-aid-kits/${id}`), api.get(`/equipment/${id}/inspections`)])
      .then(([itemRes, insRes]) => { setItem(itemRes.data); setInspections(insRes.data); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function markRefilled() {
    setSaving(true);
    try {
      await api.patch(`/first-aid-kits/${id}/contents`, { contentsStatus: "ready", refillRequired: false });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-state">Loading first-aid kit…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!item) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{item.name}</h1>
          <p className="page-sub">First-Aid Kit · {item.facility?.name || "—"}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <EquipmentStatusBadge status={item.status} />
          <Link to={`/first-aid-kits/${id}/edit`} className="btn btn-primary">Edit</Link>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3 className="section-title">Contents</h3>
          <dl className="detail-list">
            <dt>Status</dt><dd>{CONTENTS_LABELS[item.firstAidKit?.contentsStatus] || "—"}</dd>
            <dt>Refill Required</dt><dd>{item.firstAidKit?.refillRequired ? "Yes" : "No"}</dd>
            <dt>Location</dt><dd>{item.location || "—"}</dd>
          </dl>
          {item.firstAidKit?.refillRequired && (
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={markRefilled} disabled={saving}>
              {saving ? "Updating…" : "Mark as Refilled"}
            </button>
          )}
        </div>
        <div className="card">
          <h3 className="section-title">Inspection Dates</h3>
          <dl className="detail-list">
            <dt>Last Inspection</dt><dd>{item.lastInspectionDate ? new Date(item.lastInspectionDate).toLocaleDateString() : "—"}</dd>
            <dt>Next Inspection</dt><dd>{item.nextInspectionDate ? new Date(item.nextInspectionDate).toLocaleDateString() : "—"}</dd>
          </dl>
        </div>
      </div>

      <div className="card">
        <div className="page-header" style={{ marginBottom: 12 }}>
          <h3 className="section-title" style={{ margin: 0 }}>Inspection History ({inspections.length})</h3>
          <Link to={`/inspections/new?equipment=${id}`} className="btn btn-primary btn-sm">+ New Inspection</Link>
        </div>
        {inspections.length === 0 ? (
          <p className="page-sub">No inspections recorded yet.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Date</th><th>Result</th><th></th></tr></thead>
            <tbody>
              {inspections.map((i) => (
                <tr key={i._id}>
                  <td>{new Date(i.inspectionDate).toLocaleDateString()}</td>
                  <td><span className={"badge " + (i.result === "passed" ? "badge-active" : i.result === "failed" ? "badge-danger" : "badge-warn")}>{i.result}</span></td>
                  <td><Link to={`/inspections/${i._id}`} className="row-link">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
