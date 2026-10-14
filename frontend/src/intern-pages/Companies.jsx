import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../intern-api/client";
import SimpleStatusBadge from "../intern-components/SimpleStatusBadge";
import Pagination from "../intern-components/Pagination";
import EmptyState from "../intern-components/EmptyState";

export default function Companies() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const { data, meta } = await api.get("/companies", { search, status, page, limit: 10 });
      setItems(data);
      setMeta(meta);
    } catch (err) {
      setError(err.message || "Failed to load companies.");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Companies</h1>
          <p className="page-sub">Super Admin — {meta.total} compan{meta.total === 1 ? "y" : "ies"}</p>
        </div>
        <Link to="/admin/companies/new" className="btn btn-primary">+ Add Company</Link>
      </div>

      <div className="toolbar">
        <input className="input" placeholder="Search name or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading companies…</div>
      ) : items.length === 0 ? (
        <EmptyState title="No companies found" message="Try adjusting your filters, or add your first company." actionLabel="+ Add Company" onAction={() => (window.location.href = "/admin/companies/new")} />
      ) : (
        <>
          <table className="table">
            <thead><tr><th>Name</th><th>Code</th><th>Status</th></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c._id}>
                  <td><Link to={`/admin/companies/${c._id}`} className="row-link">{c.name}</Link></td>
                  <td className="row-sub">{c.code}</td>
                  <td><SimpleStatusBadge status={c.status} /></td>
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
