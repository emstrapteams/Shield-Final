import React, { useEffect, useState, useCallback } from "react";
import { api } from "../intern-api/client";

export default function TrainingDashboard() {
  const [stats, setStats] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [program, setProgram] = useState("");
  const [facility, setFacility] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/training-dashboard/stats", { program, facility, department });
      setStats(data);
    } catch (err) {
      setError(err.message || "Failed to load training statistics.");
    } finally {
      setLoading(false);
    }
  }, [program, facility, department]);

  useEffect(() => {
    api.get("/training-programs", { limit: 100 }).then(({ data }) => setPrograms(data)).catch(() => {});
    api.get("/facilities", { limit: 100 }).then(({ data }) => setFacilities(data)).catch(() => {});
    api.get("/departments", { limit: 100 }).then(({ data }) => setDepartments(data)).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Training Dashboard</h1>
          <p className="page-sub">Aggregated statistics from backend APIs — nothing hardcoded here.</p>
        </div>
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
        <select className="input" value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading statistics…</div>
      ) : stats ? (
        <>
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <div className="stat-card"><div className="stat-number">{stats.totalAssignments}</div><div className="stat-label">Total Assignments</div></div>
            <div className="stat-card"><div className="stat-number">{stats.completed}</div><div className="stat-label">Completed</div></div>
            <div className="stat-card stat-warn"><div className="stat-number">{stats.pending}</div><div className="stat-label">Pending</div></div>
            <div className="stat-card stat-danger"><div className="stat-number">{stats.missed}</div><div className="stat-label">Missed</div></div>
          </div>

          <div className="card">
            <h3 className="section-title">Completion Percentage</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "var(--primary-dark)" }}>{stats.completionPercentage}%</div>
              <div style={{ flex: 1, height: 10, background: "var(--primary-light)", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: `${stats.completionPercentage}%`, height: "100%", background: "var(--primary)" }} />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
