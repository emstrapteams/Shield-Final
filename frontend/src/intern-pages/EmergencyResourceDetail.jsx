import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../intern-api/client";
import SimpleStatusBadge from "../intern-components/SimpleStatusBadge";

export default function EmergencyResourceDetail() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/emergency-resources/${id}`)
      .then(({ data }) => setResource(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-state">Loading resource…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!resource) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{resource.name}</h1>
          <p className="page-sub">{resource.serviceType.replace(/_/g, " ")} · {resource.category}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <SimpleStatusBadge status={resource.status} />
          <Link to={`/emergency-resources/${id}/edit`} className="btn btn-primary">Edit</Link>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3 className="section-title">Contact</h3>
          <dl className="detail-list">
            <dt>Contact Person</dt><dd>{resource.contact?.contactPerson || "—"}</dd>
            <dt>Phone</dt><dd>{resource.contact?.phone || "—"}</dd>
            <dt>Email</dt><dd>{resource.contact?.email || "—"}</dd>
            <dt>Location</dt><dd>{resource.location || "—"}</dd>
          </dl>
        </div>
        <div className="card">
          <h3 className="section-title">Configuration</h3>
          <dl className="detail-list">
            <dt>Coverage Area</dt><dd>{resource.coverageArea || "—"}</dd>
            <dt>Availability</dt><dd>{resource.availability || "—"}</dd>
            <dt>Priority</dt><dd>{resource.priority}</dd>
            <dt>Integration</dt><dd><SimpleStatusBadge status={resource.integrationStatus} /></dd>
          </dl>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Notes</h3>
        <p className="page-sub">{resource.notes || "No notes recorded."}</p>
      </div>
    </div>
  );
}
