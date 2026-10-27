
import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../intern-api/client";
import StatusBadge from "../intern-components/StatusBadge";
import Pagination from "../intern-components/Pagination";
import EmptyState from "../intern-components/EmptyState";
import ConfirmDialog from "../intern-components/ConfirmDialog";


export default function Employees() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [facility, setFacility] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await api.get("/employees", {
        search, department, facility, status, page, limit: 10,
      });
      setItems(data);
      setMeta(meta);
    } catch (err) {
      setError(err.message || "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  }, [search, department, facility, status]);

  useEffect(() => {
    api.get("/departments", { limit: 100 }).then(({ data }) => setDepartments(data)).catch((err) => setError(err.message || "Failed to load departments."));
    api.get("/facilities", { limit: 100 }).then(({ data }) => setFacilities(data)).catch((err) => setError(err.message || "Failed to load facilities."));
  }, []);

  useEffect(() => { load(1); }, [load]);

  async function toggleStatus(emp) {
    const next = emp.status === "active" ? "inactive" : "active";
    try {
      await api.patch(`/employees/${emp._id}/status`, { status: next });
      setConfirmTarget(null);
      load(meta.page);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p className="page-sub">{meta.total} total employee{meta.total === 1 ? "" : "s"}</p>
        </div>
        <Link to="/employees/new" className="btn btn-primary">+ Add Employee</Link>
      </div>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search name, email, ID, designation…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select className="input" value={facility} onChange={(e) => setFacility(e.target.value)}>
          <option value="">All facilities</option>
          {facilities.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading employees…</div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No employees found"
          message="Try adjusting your search or filters, or add your first employee."
          actionLabel="+ Add Employee"
          onAction={() => navigate("/employees/new")}
        />
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Facility</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((emp) => (
                <tr key={emp._id}>
                  <td>{emp.employeeId}</td>
                  <td>
                    <Link to={`/employees/${emp._id}`} className="row-link">{emp.name}</Link>
                    <div className="row-sub">{emp.email}</div>
                  </td>
                  <td>{emp.department?.name || "—"}</td>
                  <td>{emp.facility?.name || "—"}</td>
                  <td><StatusBadge status={emp.status} /></td>
                  <td className="table-actions">
                    <Link to={`/employees/${emp._id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                    <button className="btn btn-ghost btn-sm" onClick={() => setConfirmTarget(emp)}>
                      {emp.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination page={meta.page} totalPages={meta.totalPages} onChange={load} />
        </>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.status === "active" ? "Deactivate employee?" : "Activate employee?"}
        message={`This will ${confirmTarget?.status === "active" ? "deactivate" : "activate"} ${confirmTarget?.name}.`}
        confirmLabel={confirmTarget?.status === "active" ? "Deactivate" : "Activate"}
        onConfirm={() => toggleStatus(confirmTarget)}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
