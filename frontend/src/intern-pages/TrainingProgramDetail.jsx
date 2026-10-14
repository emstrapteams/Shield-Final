import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../intern-api/client";
import SimpleStatusBadge from "../intern-components/SimpleStatusBadge";

export default function TrainingProgramDetail() {
  const { id } = useParams();
  const [program, setProgram] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/training-programs/${id}`), api.get("/training-sessions", { program: id, limit: 50 })])
      .then(([progRes, sessRes]) => { setProgram(progRes.data); setSessions(sessRes.data); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-state">Loading program…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!program) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{program.name}</h1>
          <p className="page-sub">{program.type.replace(/_/g, " ")} · {program.requiredSessionsPerYear} session(s)/year required</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <SimpleStatusBadge status={program.status} />
          <Link to={`/training-programs/${id}/edit`} className="btn btn-primary">Edit</Link>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3 className="section-title">Details</h3>
          <dl className="detail-list">
            <dt>Trainer</dt><dd>{program.trainer || "—"}</dd>
            <dt>Duration</dt><dd>{program.durationHours ? `${program.durationHours} hours` : "—"}</dd>
          </dl>
        </div>
        <div className="card">
          <h3 className="section-title">Description</h3>
          <p className="page-sub">{program.description || "No description provided."}</p>
        </div>
      </div>

      <div className="card">
        <div className="page-header" style={{ marginBottom: 12 }}>
          <h3 className="section-title" style={{ margin: 0 }}>Sessions ({sessions.length})</h3>
          <Link to={`/training-sessions/new?program=${id}`} className="btn btn-primary btn-sm">+ New Session</Link>
        </div>
        {sessions.length === 0 ? (
          <p className="page-sub">No sessions scheduled yet.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Date</th><th>Facility</th><th>Trainer</th><th>Status</th></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s._id}>
                  <td><Link to={`/training-sessions/${s._id}`} className="row-link">{new Date(s.scheduledDate).toLocaleDateString()}</Link></td>
                  <td>{s.facility?.name || "—"}</td>
                  <td className="row-sub">{s.trainer || "—"}</td>
                  <td><SimpleStatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
