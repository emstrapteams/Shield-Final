import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../intern-api/client";
import EquipmentStatusBadge from "../intern-components/EquipmentStatusBadge";

export default function EquipmentDetail() {
  const { id } = useParams();
  const [equipment, setEquipment] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/equipment/${id}`), api.get(`/equipment/${id}/inspections`)])
      .then(([eqRes, insRes]) => { setEquipment(eqRes.data); setInspections(insRes.data); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-state">Loading equipment…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!equipment) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{equipment.name}</h1>
          <p className="page-sub">{equipment.type.replace(/_/g, " ")} · {equipment.facility?.name || "—"}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <EquipmentStatusBadge status={equipment.status} />
          <Link to={`/equipment/${id}/edit`} className="btn btn-primary">Edit</Link>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3 className="section-title">Details</h3>
          <dl className="detail-list">
            <dt>Location</dt><dd>{equipment.location || "—"}</dd>
            <dt>Category</dt><dd>{equipment.category.replace(/_/g, " ")}</dd>
            <dt>Installed</dt><dd>{equipment.installationDate ? new Date(equipment.installationDate).toLocaleDateString() : "—"}</dd>
            <dt>Last Inspection</dt><dd>{equipment.lastInspectionDate ? new Date(equipment.lastInspectionDate).toLocaleDateString() : "—"}</dd>
            <dt>Next Inspection</dt><dd>{equipment.nextInspectionDate ? new Date(equipment.nextInspectionDate).toLocaleDateString() : "—"}</dd>
          </dl>
        </div>
        <div className="card">
          <h3 className="section-title">Notes</h3>
          <p className="page-sub">{equipment.notes || "No notes recorded."}</p>
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
            <thead><tr><th>Date</th><th>Result</th><th>Inspector</th><th></th></tr></thead>
            <tbody>
              {inspections.map((i) => (
                <tr key={i._id}>
                  <td>{new Date(i.inspectionDate).toLocaleDateString()}</td>
                  <td><span className={"badge " + (i.result === "passed" ? "badge-active" : i.result === "failed" ? "badge-danger" : "badge-warn")}>{i.result}</span></td>
                  <td>{i.inspector?.name || "—"}</td>
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
