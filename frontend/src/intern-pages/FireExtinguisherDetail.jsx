import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../intern-api/client";
import EquipmentStatusBadge from "../intern-components/EquipmentStatusBadge";

export default function FireExtinguisherDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/fire-extinguishers/${id}`), api.get(`/equipment/${id}/inspections`)])
      .then(([itemRes, insRes]) => { setItem(itemRes.data); setInspections(insRes.data); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-state">Loading fire extinguisher…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!item) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{item.name}</h1>
          <p className="page-sub">{item.fireExtinguisher?.extinguisherType || "Fire Extinguisher"} · {item.facility?.name || "—"}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <EquipmentStatusBadge status={item.status} />
          <Link to={`/fire-extinguishers/${id}/edit`} className="btn btn-primary">Edit</Link>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3 className="section-title">Details</h3>
          <dl className="detail-list">
            <dt>Location</dt><dd>{item.location || "—"}</dd>
            <dt>Installed</dt><dd>{item.installationDate ? new Date(item.installationDate).toLocaleDateString() : "—"}</dd>
            <dt>Last Inspection</dt><dd>{item.lastInspectionDate ? new Date(item.lastInspectionDate).toLocaleDateString() : "—"}</dd>
            <dt>Next Inspection</dt><dd>{item.nextInspectionDate ? new Date(item.nextInspectionDate).toLocaleDateString() : "—"}</dd>
          </dl>
        </div>
        <div className="card">
          <h3 className="section-title">Service &amp; Expiry</h3>
          <dl className="detail-list">
            <dt>Service Date</dt><dd>{item.fireExtinguisher?.serviceDate ? new Date(item.fireExtinguisher.serviceDate).toLocaleDateString() : "—"}</dd>
            <dt>Expiry Date</dt><dd>{item.fireExtinguisher?.expiryDate ? new Date(item.fireExtinguisher.expiryDate).toLocaleDateString() : "—"}</dd>
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
