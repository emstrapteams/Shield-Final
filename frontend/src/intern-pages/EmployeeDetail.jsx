import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../intern-api/client";
import StatusBadge from "../intern-components/StatusBadge";

export default function EmployeeDetail() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/employees/${id}`),
      api.get(`/employees/${id}/history`),
    ])
      .then(([empRes, histRes]) => {
        setEmployee(empRes.data);
        setHistory(histRes.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-state">Loading employee…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!employee) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{employee.name}</h1>
          <p className="page-sub">{employee.employeeId} · {employee.designation || "No designation"}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <StatusBadge status={employee.status} />
          <Link to={`/employees/${id}/edit`} className="btn btn-primary">Edit</Link>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3 className="section-title">Contact</h3>
          <dl className="detail-list">
            <dt>Email</dt><dd>{employee.email}</dd>
            <dt>Phone</dt><dd>{employee.phone}</dd>
            <dt>Department</dt><dd>{employee.department?.name || "—"}</dd>
            <dt>Facility</dt><dd>{employee.facility?.name || "—"}</dd>
            <dt>Joining Date</dt><dd>{employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : "—"}</dd>
          </dl>
        </div>

        <div className="card">
          <h3 className="section-title">Emergency Contact</h3>
          <dl className="detail-list">
            <dt>Name</dt><dd>{employee.emergencyContact?.name || "—"}</dd>
            <dt>Phone</dt><dd>{employee.emergencyContact?.phone || "—"}</dd>
            <dt>Relationship</dt><dd>{employee.emergencyContact?.relationship || "—"}</dd>
          </dl>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">History</h3>
        {history.length === 0 ? (
          <p className="page-sub">No history recorded yet.</p>
        ) : (
          <ul className="history-list">
            {history.slice().reverse().map((h, i) => (
              <li key={i}>
                <strong>{h.action}</strong>
                {h.detail ? ` — ${h.detail}` : ""}
                <span className="history-date"> · {new Date(h.at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
