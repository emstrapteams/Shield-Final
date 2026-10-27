import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../intern-api/client";
import Pagination from "../intern-components/Pagination";
import EmptyState from "../intern-components/EmptyState";

const RESULT_BADGE = { passed: "badge-active", failed: "badge-danger", needs_attention: "badge-warn" };

export default function Inspections() {
  const [items, setItems] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [facility, setFacility] = useState("");
  const [result, setResult] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await api.get("/inspections", { facility, result, from, to, page, limit: 10 });
      setItems(data);
      setMeta(meta);
    } catch (err) {
      setError(err.message || "Failed to load inspections.");
    } finally {
      setLoading(false);
    }
  }, [facility, result, from, to]);

  useEffect(() => {
    api.get("/facilities", { limit: 100 }).then(({ data }) => setFacilities(data)).catch((err) => setError(err.message || "Failed to load facilities."));
  }, []);
  useEffect(() => { load(1); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Inspections</h1>
          <p className="page-sub">{meta.total} total inspection{meta.total === 1 ? "" : "s"}</p>
        </div>
      </div>

      <div className="toolbar">
        <select className="input" value={facility} onChange={(e) => setFacility(e.target.value)}>
          <option value="">All facilities</option>
          {facilities.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
        <select className="input" value={result} onChange={(e) => setResult(e.target.value)}>
          <option value="">All results</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
          <option value="needs_attention">Needs Attention</option>
        </select>
        <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="From date" />
        <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} title="To date" />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading inspections…</div>
      ) : items.length === 0 ? (
        <EmptyState title="No inspections found" message="Inspections are created from an equipment's detail page." />
      ) : (
        <>
          <table className="table">
            <thead><tr><th>Date</th><th>Equipment</th><th>Facility</th><th>Inspector</th><th>Result</th></tr></thead>
            <tbody>
              {items.map((i) => (
                <tr key={i._id}>
                  <td>{new Date(i.inspectionDate).toLocaleDateString()}</td>
                  <td><Link to={`/inspections/${i._id}`} className="row-link">{i.equipment?.name || "—"}</Link></td>
                  <td>{i.equipment?.facility?.name || "—"}</td>
                  <td>{i.inspector?.name || i.inspectorName || "—"}</td>
                  <td><span className={"badge " + (RESULT_BADGE[i.result] || "badge-inactive")}>{i.result}</span></td>
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
