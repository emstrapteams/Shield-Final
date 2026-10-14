import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../intern-api/client";
import StatusBadge from "../intern-components/StatusBadge";
import EmptyState from "../intern-components/EmptyState";

export default function DepartmentDetail() {
  const { id } = useParams();
  const [department, setDepartment] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/departments/${id}`),
      api.get(`/departments/${id}/employees`),
    ])
      .then(([deptRes, empRes]) => {
        setDepartment(deptRes.data);
        setEmployees(empRes.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-state">Loading department…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!department) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{department.name}</h1>
          <p className="page-sub">{department.description || "No description"}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <StatusBadge status={department.status} />
          <Link to={`/departments/${id}/edit`} className="btn btn-primary">Edit</Link>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Employees in this department ({employees.length})</h3>
        {employees.length === 0 ? (
          <EmptyState title="No employees assigned" message="Employees assigned to this department will appear here." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e._id}>
                  <td>{e.employeeId}</td>
                  <td><Link to={`/employees/${e._id}`} className="row-link">{e.name}</Link></td>
                  <td>{e.designation || "—"}</td>
                  <td><StatusBadge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
