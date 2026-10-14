import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../intern-api/client";

const STATUS_BADGE = {
  pending: "badge-inactive", in_progress: "badge-warn", completed: "badge-active",
  overdue: "badge-danger", verified: "badge-active",
};

export default function CorrectiveActionDetail() {
  const { id } = useParams();
  const [action, setAction] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [evidenceInput, setEvidenceInput] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");

  function load() {
    setLoading(true);
    api.get(`/corrective-actions/${id}`)
      .then(({ data }) => setAction(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [id]);

  async function changeStatus(status) {
    setBusy(true);
    try {
      await api.patch(`/corrective-actions/${id}/status`, { status });
      load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function addEvidence() {
    if (!evidenceInput.trim()) return;
    setBusy(true);
    try {
      await api.patch(`/corrective-actions/${id}/evidence`, { evidence: evidenceInput.trim() });
      setEvidenceInput("");
      load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function verify() {
    setBusy(true);
    try {
      await api.patch(`/corrective-actions/${id}/verify`, { verificationNotes });
      setVerificationNotes("");
      load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  if (loading) return <div className="loading-state">Loading corrective action…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!action) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{action.title}</h1>
          <p className="page-sub">Source: {action.sourceType.replace(/_/g, " ")} · <span className={"priority-tag priority-" + action.priority}>{action.priority}</span></p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className={"badge " + (STATUS_BADGE[action.status] || "badge-inactive")}>{action.status.replace(/_/g, " ")}</span>
          <Link to={`/corrective-actions/${id}/edit`} className="btn btn-primary">Edit</Link>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3 className="section-title">Details</h3>
          <dl className="detail-list">
            <dt>Assigned To</dt><dd>{action.assignedTo?.name || action.assignedTeam || "—"}</dd>
            <dt>Due Date</dt><dd>{action.dueDate ? new Date(action.dueDate).toLocaleDateString() : "—"}</dd>
          </dl>
          <h3 className="section-title" style={{ marginTop: 16 }}>Description</h3>
          <p className="page-sub">{action.description || "No description provided."}</p>
        </div>

        <div className="card">
          <h3 className="section-title">Status</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {["pending", "in_progress", "completed"].map((s) => (
              <button key={s} className="btn btn-ghost btn-sm" disabled={busy || action.status === s} onClick={() => changeStatus(s)}>
                Mark {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {action.status === "completed" && (
            <>
              <h3 className="section-title">Verify Completion</h3>
              <textarea
                className="input" style={{ width: "100%", marginBottom: 8 }} rows={2}
                placeholder="Verification notes (optional)"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" disabled={busy} onClick={verify}>Verify</button>
            </>
          )}
          {action.status === "verified" && action.verificationNotes && (
            <p className="page-sub"><strong>Verification notes:</strong> {action.verificationNotes}</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Evidence ({action.evidence.length})</h3>
        {action.evidence.length === 0 ? (
          <p className="page-sub">No evidence uploaded yet.</p>
        ) : (
          <ul className="history-list">
            {action.evidence.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            className="input" style={{ flex: 1 }}
            placeholder="Evidence URL or reference"
            value={evidenceInput}
            onChange={(e) => setEvidenceInput(e.target.value)}
          />
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={addEvidence}>+ Add</button>
        </div>
      </div>
    </div>
  );
}
