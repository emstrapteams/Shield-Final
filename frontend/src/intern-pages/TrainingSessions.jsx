import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../intern-api/client";
import SimpleStatusBadge from "../intern-components/SimpleStatusBadge";
import Pagination from "../intern-components/Pagination";
import EmptyState from "../intern-components/EmptyState";

export default function TrainingSessions() {
  const [items, setItems] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [program, setProgram] = useState("");
  const [facility, setFacility] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await api.get("/training-sessions", { program, facility, status, page, limit: 10 });
      setItems(data);
      setMeta(meta);
    } catch (err) {
      setError(err.message || "Failed to load training sessions.");
    } finally {
      setLoading(false);
    }
  }, [program, facility, status]);

  useEffect(() => {
    api.get("/training-programs", { limit: 100 }).then(({ data }) => setPrograms(data)).catch(() => {});
    api.get("/facilities", { limit: 100 }).then(({ data }) => setFacilities(data)).catch(() => {});
  }, []);
  useEffect(() => { load(1); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Training Sessions</h1>
          <p className="page-sub">{meta.total} session{meta.total === 1 ? "" : "s"}</p>
        </div>
        <Link to="/training-sessions/new" className="btn btn-primary">+ Schedule Session</Link>
      </div>

      <div className="toolbar">
        <select className="input" value={program} onChange={(e) => setProgram(e.target.value)}>
          <option value="">All programs</option>
          {programs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <select className="input" value={facility} onChange={(e) => setFacility(e.target.value)}>
          <option value="">All facilities</option>
          {facilities.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading sessions…</div>
      ) : items.length === 0 ? (
        <EmptyState title="No training sessions found" message="Try adjusting your filters, or schedule your first session." actionLabel="+ Schedule Session" onAction={() => (window.location.href = "/training-sessions/new")} />
      ) : (
        <>
          <table className="table">
            <thead><tr><th>Date</th><th>Program</th><th>Facility</th><th>Trainer</th><th>Status</th></tr></thead>
            <tbody>
              {items.map((s) => (
                <tr key={s._id}>
                  <td><Link to={`/training-sessions/${s._id}`} className="row-link">{new Date(s.scheduledDate).toLocaleDateString()}</Link></td>
                  <td>{s.program?.name || "—"}</td>
                  <td>{s.facility?.name || "—"}</td>
                  <td className="row-sub">{s.trainer || "—"}</td>
                  <td><SimpleStatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={meta.page} totalPages={meta.totalPages} onChange={load} />
        </>
      )}
    </div>
  );
}
