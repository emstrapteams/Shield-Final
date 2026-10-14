import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../intern-api/client";
import SimpleStatusBadge from "../intern-components/SimpleStatusBadge";
import ConfirmDialog from "../intern-components/ConfirmDialog";

export default function CompanyDetail() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmStatus, setConfirmStatus] = useState(null);

  function load() {
    setLoading(true);
    Promise.all([api.get(`/companies/${id}`), api.get(`/companies/${id}/usage`)])
      .then(([compRes, usageRes]) => { setCompany(compRes.data); setUsage(usageRes.data); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [id]);

  async function applyStatus(status) {
    try {
      await api.patch(`/companies/${id}/status`, { status });
      setConfirmStatus(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="loading-state">Loading company…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!company) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{company.name}</h1>
          <p className="page-sub">Code: {company.code}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <SimpleStatusBadge status={company.status} />
          <Link to={`/admin/companies/${id}/edit`} className="btn btn-primary">Edit</Link>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Status</h3>
        <div style={{ display: "flex", gap: 8 }}>
          {["active", "suspended", "deactivated"].map((s) => (
            <button key={s} className="btn btn-ghost btn-sm" disabled={company.status === s} onClick={() => setConfirmStatus(s)}>
              Set {s}
            </button>
          ))}
        </div>
      </div>

      {usage && (
        <div className="card">
          <h3 className="section-title">Usage</h3>
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <div className="stat-card"><div className="stat-number">{usage.employees}</div><div className="stat-label">Employees</div></div>
            <div className="stat-card"><div className="stat-number">{usage.departments}</div><div className="stat-label">Departments</div></div>
            <div className="stat-card"><div className="stat-number">{usage.facilities}</div><div className="stat-label">Facilities</div></div>
            <div className="stat-card"><div className="stat-number">{usage.equipment}</div><div className="stat-label">Equipment Items</div></div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmStatus}
        title={`Set company status to "${confirmStatus}"?`}
        message="This changes the company's platform-level status."
        confirmLabel="Confirm"
        onConfirm={() => applyStatus(confirmStatus)}
        onCancel={() => setConfirmStatus(null)}
      />
    </div>
  );
}
