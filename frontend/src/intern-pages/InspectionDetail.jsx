import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../intern-api/client";

const RESULT_BADGE = { passed: "badge-active", failed: "badge-danger", needs_attention: "badge-warn" };
const ITEM_BADGE = { pass: "badge-active", fail: "badge-danger", needs_attention: "badge-warn", not_applicable: "badge-inactive" };

export default function InspectionDetail() {
  const { id } = useParams();
  const [inspection, setInspection] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/inspections/${id}`)
      .then(({ data }) => setInspection(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-state">Loading inspection…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!inspection) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Inspection — {inspection.equipment?.name || "Equipment"}</h1>
          <p className="page-sub">{new Date(inspection.inspectionDate).toLocaleDateString()} · {inspection.inspector?.name || inspection.inspectorName || "Unspecified inspector"}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className={"badge " + (RESULT_BADGE[inspection.result] || "badge-inactive")}>{inspection.result}</span>
          <Link to={`/inspections/${id}/edit`} className="btn btn-primary">Edit</Link>
          {inspection.equipment?._id && (
            <Link to={`/equipment/${inspection.equipment._id}`} className="btn btn-ghost">View Equipment</Link>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Checklist</h3>
        <table className="table">
          <thead><tr><th>Item</th><th>Result</th><th>Notes</th></tr></thead>
          <tbody>
            {inspection.checklist.map((c, i) => (
              <tr key={i}>
                <td>{c.item}</td>
                <td><span className={"badge " + (ITEM_BADGE[c.result] || "badge-inactive")}>{c.result.replace(/_/g, " ")}</span></td>
                <td className="row-sub">{c.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3 className="section-title">Notes</h3>
          <p className="page-sub">{inspection.notes || "No notes recorded."}</p>
        </div>
        <div className="card">
          <h3 className="section-title">Follow-up</h3>
          <dl className="detail-list">
            <dt>Next Inspection</dt><dd>{inspection.nextInspectionDate ? new Date(inspection.nextInspectionDate).toLocaleDateString() : "—"}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
