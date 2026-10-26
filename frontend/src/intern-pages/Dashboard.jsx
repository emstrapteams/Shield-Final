import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../intern-api/client";

const dashboardStyles = `
.shield-dashboard {
  --sd-ink: #17243a;
  --sd-muted: #66758b;
  --sd-border: #e2e8f0;
  --sd-blue: #315ee7;
  --sd-amber: #a96508;
  --sd-red: #bd3c43;
  color: var(--sd-ink);
  min-width: 0;
}
.shield-dashboard * { box-sizing: border-box; }
.shield-dashboard .sd-hero {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 16px; flex-wrap: wrap; margin-bottom: 24px;
}
.shield-dashboard .sd-eyebrow {
  margin: 0 0 6px; color: #64748b; font-size: 11px; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase;
}
.shield-dashboard .sd-title {
  margin: 0; color: var(--sd-ink); font-size: 25px;
  font-weight: 700; line-height: 1.25; letter-spacing: -.02em;
}
.shield-dashboard .sd-subtitle {
  margin: 7px 0 0; color: var(--sd-muted); font-size: 13px; line-height: 1.5;
}
.shield-dashboard .sd-filter {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 9px 11px; border: 1px solid var(--sd-border); border-radius: 8px;
  background: #fff;
}
.shield-dashboard .sd-filter label {
  color: #52627b; font-size: 12px; font-weight: 600; white-space: nowrap;
}
.shield-dashboard .sd-filter select {
  min-width: 160px; max-width: 240px; padding: 8px 28px 8px 9px;
  border: 1px solid #d6deea; border-radius: 6px; background: #fff;
  color: var(--sd-ink); font: inherit; font-size: 12px; outline: none;
}
.shield-dashboard .sd-filter select:focus {
  border-color: var(--sd-blue); box-shadow: 0 0 0 2px rgba(49, 94, 231, .1);
}
.shield-dashboard .sd-section { margin-top: 23px; }
.shield-dashboard .sd-section-head {
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px; margin: 0 0 10px;
}
.shield-dashboard .sd-section-title {
  margin: 0; color: var(--sd-ink); font-size: 14px; font-weight: 700;
}
.shield-dashboard .sd-section-note { color: #8190a5; font-size: 11px; }
.shield-dashboard .sd-grid {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px;
}
.shield-dashboard .sd-grid.sd-grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.shield-dashboard .sd-grid.sd-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.shield-dashboard .sd-stat {
  min-width: 0; min-height: 83px; padding: 13px 15px;
  border: 1px solid var(--sd-border); border-radius: 8px;
  background: #fff;
}
.shield-dashboard .sd-stat-top {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
}
.shield-dashboard .sd-stat-label {
  margin: 0; color: var(--sd-muted); font-size: 12px; font-weight: 500;
  line-height: 1.4; overflow-wrap: anywhere;
}
.shield-dashboard .sd-stat-icon { display: none; }
.shield-dashboard .sd-stat-number {
  margin-top: 9px; color: var(--sd-ink); font-size: 24px;
  font-weight: 700; letter-spacing: -.025em; line-height: 1;
  font-variant-numeric: tabular-nums;
}
.shield-dashboard .sd-panel {
  padding: 17px; border: 1px solid var(--sd-border); border-radius: 8px;
  background: #fff;
}
.shield-dashboard .sd-training-head {
  display: flex; justify-content: space-between; align-items: flex-end;
  gap: 12px; margin-bottom: 12px; flex-wrap: wrap;
}
.shield-dashboard .sd-training-value {
  color: var(--sd-ink); font-size: 25px; font-weight: 700; letter-spacing: -.02em;
}
.shield-dashboard .sd-training-caption { color: var(--sd-muted); font-size: 12px; }
.shield-dashboard .sd-progress {
  width: 100%; height: 7px; overflow: hidden; border-radius: 99px; background: #e9edf4;
}
.shield-dashboard .sd-progress-fill {
  height: 100%; border-radius: inherit; background: var(--sd-blue);
  transition: width .25s ease;
}
.shield-dashboard .sd-training-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  margin-top: 9px; color: var(--sd-muted); font-size: 11px; flex-wrap: wrap;
}
.shield-dashboard .sd-session-pill {
  color: var(--sd-muted); font-size: 12px; font-weight: 600;
}
.shield-dashboard .sd-alert {
  padding: 12px 14px; border: 1px solid #f0c5c7; border-radius: 7px;
  color: #9e2f37; background: #fff7f7; font-size: 13px; margin-bottom: 14px;
}
.shield-dashboard .sd-state {
  padding: 30px 18px; border: 1px solid var(--sd-border); border-radius: 8px;
  text-align: center; background: #fff; color: var(--sd-muted);
}
.shield-dashboard .sd-spinner {
  width: 22px; height: 22px; margin: 0 auto 12px; border: 2px solid #dbe3f1;
  border-top-color: var(--sd-blue); border-radius: 50%; animation: sd-spin .75s linear infinite;
}
.shield-dashboard .sd-state-title { margin: 0 0 5px; color: var(--sd-ink); font-size: 14px; font-weight: 700; }
.shield-dashboard .sd-state-copy { margin: 0; font-size: 12px; line-height: 1.5; }
.shield-dashboard .sd-retry {
  margin-top: 12px; padding: 8px 12px; border: 0; border-radius: 6px;
  background: var(--sd-blue); color: white; font: inherit; font-size: 12px;
  font-weight: 600; cursor: pointer;
}
@keyframes sd-spin { to { transform: rotate(360deg); } }
@media (max-width: 1050px) {
  .shield-dashboard .sd-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 720px) {
  .shield-dashboard .sd-grid, .shield-dashboard .sd-grid.sd-grid-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .shield-dashboard .sd-grid.sd-grid-2 { grid-template-columns: 1fr; }
  .shield-dashboard .sd-filter { width: 100%; justify-content: space-between; }
  .shield-dashboard .sd-filter select { flex: 1; min-width: 0; max-width: none; }
}
@media (max-width: 420px) {
  .shield-dashboard .sd-grid, .shield-dashboard .sd-grid.sd-grid-3 { grid-template-columns: 1fr 1fr; gap: 8px; }
  .shield-dashboard .sd-stat { padding: 11px; }
  .shield-dashboard .sd-stat-number { font-size: 22px; }
  .shield-dashboard .sd-stat-label { font-size: 11px; }
}
@media (prefers-reduced-motion: reduce) {
  .shield-dashboard *, .shield-dashboard *::before, .shield-dashboard *::after {
    animation-duration: .01ms !important; transition-duration: .01ms !important;
  }
}
`;

function StatCard({ number, label, tone = "", icon = "•" }) {
  const safeNumber = number ?? 0;
  return (
    <article className={`sd-stat ${tone ? `tone-${tone}` : ""}`}>
      <div className="sd-stat-top">
        <span className="sd-stat-label" style={{ marginTop: 0 }}>{label}</span>
        <span className="sd-stat-icon" aria-hidden="true">{icon}</span>
      </div>
      <div className="sd-stat-number">{safeNumber}</div>
    </article>
  );
}

function Section({ title, note, children }) {
  return (
    <section className="sd-section">
      <div className="sd-section-head">
        <h2 className="sd-section-title">{title}</h2>
        {note ? <span className="sd-section-note">{note}</span> : null}
      </div>
      {children}
    </section>
  );
}

export default function Dashboard({ refreshKey = 0 }) {
  const [data, setData] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [facility, setFacility] = useState("");
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [facilitiesError, setFacilitiesError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const { data: overview } = await api.get("/dashboard/overview", { facility });
      if (
        !overview?.employees ||
        !overview?.facilities ||
        !overview?.equipment ||
        !overview?.inspections ||
        !overview?.correctiveActions ||
        !overview?.training ||
        !overview?.drills
      ) {
        throw new Error("The server returned an unexpected safety dashboard response.");
      }
      if (currentRequestId === requestId.current) {
        setData(overview);
      }
    } catch (err) {
      if (currentRequestId === requestId.current) {
        setData(null);
        setError(err?.message || "Failed to load dashboard.");
      }
    } finally {
      if (currentRequestId === requestId.current) {
        setLoading(false);
      }
    }
  }, [facility]);

  const loadFacilities = useCallback(async () => {
    try {
      const { data: facilityData } = await api.get("/facilities", { limit: 100 });
      if (!Array.isArray(facilityData)) {
        throw new Error("The server returned an unexpected facilities response.");
      }
      setFacilitiesError("");
      setFacilities(facilityData);
    } catch (err) {
      setFacilities([]);
      setFacilitiesError(err?.message || "Failed to load facilities.");
    } finally {
      setFacilitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) loadFacilities();
    });
    return () => {
      active = false;
    };
  }, [loadFacilities]);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) load();
    });
    return () => {
      active = false;
      requestId.current += 1;
    };
  }, [load, refreshKey]);

  const trainingPercentage = Math.min(
    100,
    Math.max(0, Number(data?.training?.completionPercentage) || 0)
  );

  return (
    <div className="shield-dashboard">
      <style>{dashboardStyles}</style>

      <header className="sd-hero">
        <div>
          <p className="sd-eyebrow">Safety overview</p>
          <h1 className="sd-title">Company Admin Dashboard</h1>
          <p className="sd-subtitle">
            A live snapshot of your workforce, safety readiness, and follow-up actions.
          </p>
        </div>
        <div className="sd-filter">
          <label htmlFor="sd-facility-filter">Facility</label>
          <select
            id="sd-facility-filter"
            value={facility}
            disabled={facilitiesLoading}
            onChange={(event) => setFacility(event.target.value)}
          >
            <option value="">{facilitiesLoading ? "Loading facilities…" : "All facilities"}</option>
            {facilities.map((item) => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </select>
        </div>
      </header>

      {facilitiesError && (
        <div className="sd-alert" role="alert">
          <strong>Facilities could not be loaded.</strong> {facilitiesError}
          <button
            className="sd-retry"
            type="button"
            onClick={() => {
              setFacilitiesLoading(true);
              loadFacilities();
            }}
          >
            Try again
          </button>
        </div>
      )}

      {error && (
        <div className="sd-alert" role="alert">
          <strong>Dashboard could not be refreshed.</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="sd-state" role="status" aria-live="polite">
          <div className="sd-spinner" />
          <p className="sd-state-title">Loading your safety overview</p>
          <p className="sd-state-copy">Fetching the latest figures for this company.</p>
        </div>
      ) : data ? (
        <>
          <Section title="Workforce & facilities" note="People and sites">
            <div className="sd-grid">
              <StatCard number={data.employees?.total} label="Total employees" icon="PE" />
              <StatCard number={data.employees?.active} label="Active employees" tone="good" icon="AC" />
              <StatCard number={data.facilities?.total} label="Total facilities" icon="FA" />
              <StatCard number={data.facilities?.active} label="Active facilities" tone="good" icon="OK" />
            </div>
          </Section>

          <Section title="Safety equipment" note="Readiness & maintenance">
            <div className="sd-grid">
              <StatCard number={data.equipment?.byStatus?.active} label="Active" tone="good" icon="OK" />
              <StatCard number={data.equipment?.byStatus?.inspection_due} label="Inspection due" tone="warn" icon="!" />
              <StatCard number={data.equipment?.byStatus?.overdue} label="Overdue" tone="danger" icon="!" />
              <StatCard number={data.equipment?.byStatus?.replacement_required} label="Replacement required" tone="danger" icon="R" />
              <StatCard number={data.equipment?.inspectionsDueNext7Days} label="Due in the next 7 days" tone="warn" icon="7D" />
            </div>
          </Section>

          <Section title="Inspections" note="Last 30 days">
            <div className="sd-grid sd-grid-3">
              <StatCard number={data.inspections?.last30Days?.passed} label="Passed" tone="good" icon="OK" />
              <StatCard number={data.inspections?.last30Days?.failed} label="Failed" tone="danger" icon="!" />
              <StatCard number={data.inspections?.last30Days?.needs_attention} label="Needs attention" tone="warn" icon="!" />
            </div>
          </Section>

          <Section title="Corrective actions" note="Track outstanding work">
            <div className="sd-grid">
              <StatCard number={data.correctiveActions?.byStatus?.pending} label="Pending" icon="P" />
              <StatCard number={data.correctiveActions?.byStatus?.in_progress} label="In progress" tone="warn" icon="…" />
              <StatCard number={data.correctiveActions?.byStatus?.completed} label="Completed" tone="good" icon="OK" />
              <StatCard number={data.correctiveActions?.byStatus?.overdue} label="Overdue" tone="danger" icon="!" />
              <StatCard number={data.correctiveActions?.byStatus?.verified} label="Verified" tone="good" icon="V" />
            </div>
          </Section>

          <Section title="Training" note="Completion progress">
            <div className="sd-panel">
              <div className="sd-training-head">
                <div>
                  <div className="sd-training-value">{trainingPercentage}%</div>
                  <div className="sd-training-caption">Training completion</div>
                </div>
                <span className="sd-session-pill">
                  {data.training?.upcomingSessions ?? 0} upcoming sessions
                </span>
              </div>
              <div
                className="sd-progress"
                role="progressbar"
                aria-label="Training completion"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={trainingPercentage}
              >
                <div className="sd-progress-fill" style={{ width: `${trainingPercentage}%` }} />
              </div>
              <div className="sd-training-foot">
                <span>0%</span>
                <span>Completion across recorded training</span>
                <span>100%</span>
              </div>
            </div>
          </Section>

          <Section title="Emergency drills" note="Preparedness">
            <div className="sd-grid sd-grid-2">
              <StatCard number={data.drills?.upcomingNext90Days} label="Upcoming in the next 90 days" icon="90" />
              <StatCard number={data.drills?.openIssues} label="Open drill issues" tone="warn" icon="!" />
            </div>
          </Section>
        </>
      ) : (
        <div className="sd-state">
          <p className="sd-state-title">No dashboard data available</p>
          <p className="sd-state-copy">Try refreshing the overview. Your existing records will remain unchanged.</p>
          <button className="sd-retry" type="button" onClick={load}>Try again</button>
        </div>
      )}
    </div>
  );
}
