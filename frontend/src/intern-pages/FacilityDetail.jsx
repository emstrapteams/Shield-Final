import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../intern-api/client";
import StatusBadge from "../intern-components/StatusBadge";

export default function FacilityDetail() {
  const { id } = useParams();
  const [facility, setFacility] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/facilities/${id}`)
      .then(({ data }) => setFacility(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-state">Loading facility…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!facility) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{facility.name}</h1>
          <p className="page-sub">{[facility.city, facility.state, facility.country].filter(Boolean).join(", ") || "No location set"}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <StatusBadge status={facility.status} />
          <Link to={`/facilities/${id}/edit`} className="btn btn-primary">Edit</Link>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3 className="section-title">Location</h3>
          <dl className="detail-list">
            <dt>Address</dt><dd>{facility.address || "—"}</dd>
            <dt>City</dt><dd>{facility.city || "—"}</dd>
            <dt>State</dt><dd>{facility.state || "—"}</dd>
            <dt>Country</dt><dd>{facility.country || "—"}</dd>
            <dt>Latitude</dt><dd>{facility.latitude ?? "—"}</dd>
            <dt>Longitude</dt><dd>{facility.longitude ?? "—"}</dd>
          </dl>
        </div>

        <div className="card">
          <h3 className="section-title">Site Details</h3>
          <dl className="detail-list">
            <dt>Buildings</dt><dd>{facility.buildings?.length ? facility.buildings.join(", ") : "—"}</dd>
            <dt>Floors</dt><dd>{facility.floors?.length ? facility.floors.join(", ") : "—"}</dd>
            <dt>Zones</dt><dd>{facility.zones?.length ? facility.zones.join(", ") : "—"}</dd>
            <dt>Emergency Exits</dt><dd>{facility.emergencyExits?.length ? facility.emergencyExits.join(", ") : "—"}</dd>
            <dt>Assembly Points</dt><dd>{facility.assemblyPoints?.length ? facility.assemblyPoints.join(", ") : "—"}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
