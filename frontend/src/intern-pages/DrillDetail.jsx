import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../intern-api/client";
import SimpleStatusBadge from "../intern-components/SimpleStatusBadge";

export default function DrillDetail() {
  const { id } = useParams();
  const [drill, setDrill] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedToAdd, setSelectedToAdd] = useState("");
  const [observationText, setObservationText] = useState("");
  const [issueText, setIssueText] = useState("");
  const [issueSeverity, setIssueSeverity] = useState("medium");
  const [completionTime, setCompletionTime] = useState("");
  const [actionTitle, setActionTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([api.get(`/drills/${id}`), api.get("/employees", { limit: 200 })])
      .then(([drillRes, empRes]) => { setDrill(drillRes.data); setEmployees(empRes.data); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [id]);

  async function addParticipant() {
    if (!selectedToAdd) return;
    setBusy(true);
    try {
      const currentIds = drill.participants.map((p) => p.employee._id || p.employee);
      await api.patch(`/drills/${id}/participants`, { employeeIds: [...currentIds, selectedToAdd] });
      setSelectedToAdd("");
      load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function toggleAttended(employeeId, attended) {
    setBusy(true);
    try {
      await api.patch(`/drills/${id}/attendance`, { employeeId, attended });
      load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function saveResults(status) {
    setBusy(true);
    try {
      await api.patch(`/drills/${id}/results`, { status, completionTimeMinutes: completionTime ? Number(completionTime) : undefined });
      load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function addObservation() {
    if (!observationText.trim()) return;
    setBusy(true);
    try {
      await api.post(`/drills/${id}/observations`, { text: observationText.trim() });
      setObservationText("");
      load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function addIssue() {
    if (!issueText.trim()) return;
    setBusy(true);
    try {
      await api.post(`/drills/${id}/issues`, { description: issueText.trim(), severity: issueSeverity });
      setIssueText("");
      load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function createAndLinkAction() {
    if (!actionTitle.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post("/corrective-actions", {
        sourceType: "drill", sourceId: id, title: actionTitle.trim(), priority: "medium",
      });
      await api.patch(`/drills/${id}/corrective-actions`, { correctiveActionId: data._id });
      setActionTitle("");
      load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  if (loading) return <div className="loading-state">Loading drill…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!drill) return null;

  const participantIds = new Set(drill.participants.map((p) => (p.employee._id || p.employee)));
  const availableToAdd = employees.filter((e) => !participantIds.has(e._id));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{drill.name}</h1>
          <p className="page-sub">{drill.type.replace(/_/g, " ")} · {drill.facility?.name || "—"} · {new Date(drill.date).toLocaleDateString()}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <SimpleStatusBadge status={drill.status} />
          <Link to={`/drills/${id}/edit`} className="btn btn-primary">Edit</Link>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3 className="section-title">Scenario</h3>
          <p className="page-sub">{drill.scenario || "No scenario recorded."}</p>
        </div>
        <div className="card">
          <h3 className="section-title">Results</h3>
          <dl className="detail-list">
            <dt>Completion Time</dt><dd>{drill.completionTimeMinutes ? `${drill.completionTimeMinutes} min` : "—"}</dd>
          </dl>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input className="input" type="number" placeholder="Minutes" value={completionTime} onChange={(e) => setCompletionTime(e.target.value)} style={{ width: 100 }} />
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => saveResults("in_progress")}>Mark In Progress</button>
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => saveResults("completed")}>Mark Completed</button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Participants ({drill.participants.length})</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <select className="input" style={{ flex: 1 }} value={selectedToAdd} onChange={(e) => setSelectedToAdd(e.target.value)}>
            <option value="">— Select an employee —</option>
            {availableToAdd.map((e) => <option key={e._id} value={e._id}>{e.name} ({e.employeeId})</option>)}
          </select>
          <button className="btn btn-primary btn-sm" disabled={busy || !selectedToAdd} onClick={addParticipant}>+ Add</button>
        </div>
        {drill.participants.length === 0 ? (
          <p className="page-sub">No participants added yet.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Employee</th><th>Attended</th></tr></thead>
            <tbody>
              {drill.participants.map((p) => (
                <tr key={p.employee._id || p.employee}>
                  <td>{p.employee?.name || "—"}</td>
                  <td>
                    <input type="checkbox" checked={p.attended} onChange={(e) => toggleAttended(p.employee._id || p.employee, e.target.checked)} disabled={busy} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3 className="section-title">Observations ({drill.observations.length})</h3>
          <ul className="history-list">
            {drill.observations.map((o, i) => <li key={i}>{o.text}<span className="history-date"> · {new Date(o.createdAt).toLocaleDateString()}</span></li>)}
          </ul>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input className="input" style={{ flex: 1 }} placeholder="Add observation" value={observationText} onChange={(e) => setObservationText(e.target.value)} />
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={addObservation}>+ Add</button>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">Issues ({drill.issues.length})</h3>
          <ul className="history-list">
            {drill.issues.map((iss, i) => (
              <li key={i}><span className={"priority-tag priority-" + (iss.severity === "high" ? "critical" : iss.severity === "medium" ? "high" : "low")}>{iss.severity}</span> {iss.description}</li>
            ))}
          </ul>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input className="input" style={{ flex: 1 }} placeholder="Describe issue" value={issueText} onChange={(e) => setIssueText(e.target.value)} />
            <select className="input" value={issueSeverity} onChange={(e) => setIssueSeverity(e.target.value)} style={{ width: 110 }}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={addIssue}>+ Add</button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Linked Corrective Actions ({drill.correctiveActions.length})</h3>
        {drill.correctiveActions.length === 0 ? (
          <p className="page-sub">No corrective actions linked yet.</p>
        ) : (
          <ul className="history-list">
            {drill.correctiveActions.map((a) => (
              <li key={a._id}><Link to={`/corrective-actions/${a._id}`} className="row-link">{a.title}</Link> — {a.status} <span className={"priority-tag priority-" + a.priority}>{a.priority}</span></li>
            ))}
          </ul>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input className="input" style={{ flex: 1 }} placeholder="New corrective action title" value={actionTitle} onChange={(e) => setActionTitle(e.target.value)} />
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={createAndLinkAction}>+ Create &amp; Link</button>
        </div>
      </div>
    </div>
  );
}
