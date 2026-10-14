import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../intern-api/client";
import SimpleStatusBadge from "../intern-components/SimpleStatusBadge";

export default function TrainingSessionDetail() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedToAssign, setSelectedToAssign] = useState("");
  const [certInputs, setCertInputs] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      api.get(`/training-sessions/${id}`),
      api.get(`/training-sessions/${id}/attendance`),
      api.get("/employees", { limit: 200 }),
    ])
      .then(([sessRes, attRes, empRes]) => {
        setSession(sessRes.data);
        setAttendance(attRes.data);
        setEmployees(empRes.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [id]);

  async function assignSelected() {
    if (!selectedToAssign) return;
    setBusy(true);
    try {
      await api.post(`/training-sessions/${id}/assign`, { employeeIds: [selectedToAssign] });
      setSelectedToAssign("");
      load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function setStatus(recordId, status) {
    setBusy(true);
    try {
      await api.patch(`/training-attendance/${recordId}/status`, { status });
      load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function addCertificate(recordId) {
    const value = (certInputs[recordId] || "").trim();
    if (!value) return;
    setBusy(true);
    try {
      await api.patch(`/training-attendance/${recordId}/certificates`, { certificates: value });
      setCertInputs((c) => ({ ...c, [recordId]: "" }));
      load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  if (loading) return <div className="loading-state">Loading session…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!session) return null;

  const assignedIds = new Set(attendance.map((a) => a.employee?._id));
  const availableToAssign = employees.filter((e) => !assignedIds.has(e._id));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{session.program?.name || "Training Session"}</h1>
          <p className="page-sub">{new Date(session.scheduledDate).toLocaleDateString()} · {session.facility?.name || "—"}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <SimpleStatusBadge status={session.status} />
          <Link to={`/training-sessions/${id}/edit`} className="btn btn-primary">Edit</Link>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Assign Employees</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <select className="input" style={{ flex: 1 }} value={selectedToAssign} onChange={(e) => setSelectedToAssign(e.target.value)}>
            <option value="">— Select an employee —</option>
            {availableToAssign.map((e) => <option key={e._id} value={e._id}>{e.name} ({e.employeeId})</option>)}
          </select>
          <button className="btn btn-primary btn-sm" disabled={busy || !selectedToAssign} onClick={assignSelected}>+ Assign</button>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Attendance ({attendance.length})</h3>
        {attendance.length === 0 ? (
          <p className="page-sub">No employees assigned yet.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Employee</th><th>Status</th><th>Certificates</th><th></th></tr></thead>
            <tbody>
              {attendance.map((a) => (
                <tr key={a._id}>
                  <td>{a.employee?.name || "—"}<div className="row-sub">{a.employee?.employeeId}</div></td>
                  <td><SimpleStatusBadge status={a.status} /></td>
                  <td className="row-sub">{a.certificates?.length ? `${a.certificates.length} file(s)` : "—"}</td>
                  <td className="table-actions">
                    {["assigned", "attended", "completed", "missed"].map((s) => (
                      <button key={s} className="btn btn-ghost btn-sm" disabled={busy || a.status === s} onClick={() => setStatus(a._id, s)}>{s}</button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {attendance.map((a) => (
          <div key={a._id} style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
            <span className="row-sub" style={{ width: 160 }}>{a.employee?.name}</span>
            <input
              className="input" style={{ flex: 1 }}
              placeholder="Certificate URL/reference"
              value={certInputs[a._id] || ""}
              onChange={(e) => setCertInputs((c) => ({ ...c, [a._id]: e.target.value }))}
            />
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => addCertificate(a._id)}>+ Add</button>
          </div>
        ))}
      </div>
    </div>
  );
}
