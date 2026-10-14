import React, { useState } from "react";
import { downloadReport } from "../intern-api/client";

const REPORTS = [
  { key: "equipment", label: "Safety Equipment Report", path: "/reports/equipment" },
  { key: "fire-extinguishers", label: "Fire Extinguisher Report", path: "/reports/fire-extinguishers" },
  { key: "first-aid-kits", label: "First-Aid Kit Report", path: "/reports/first-aid-kits" },
  { key: "inspections", label: "Inspection Report", path: "/reports/inspections" },
  { key: "training", label: "Training Report", path: "/reports/training" },
  { key: "drills", label: "Emergency Drill Report", path: "/reports/drills" },
  { key: "company-safety-summary", label: "Company Safety Summary", path: "/reports/company-safety-summary" },
];

const FORMATS = [
  { value: "csv", label: "CSV" },
  { value: "xlsx", label: "Excel" },
  { value: "pdf", label: "PDF" },
];

export default function Reports() {
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");

  async function handleDownload(report, format) {
    setBusyKey(report.key + format);
    setError("");
    try {
      await downloadReport(report.path, { format }, `${report.key}.${format}`);
    } catch (err) {
      setError(err.message || "Failed to generate report.");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p className="page-sub">Generate and download reports in CSV, Excel, or PDF.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <table className="table">
          <thead><tr><th>Report</th><th>Download</th></tr></thead>
          <tbody>
            {REPORTS.map((r) => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td className="table-actions" style={{ justifyContent: "flex-start" }}>
                  {FORMATS.map((f) => (
                    <button
                      key={f.value}
                      className="btn btn-ghost btn-sm"
                      disabled={busyKey === r.key + f.value}
                      onClick={() => handleDownload(r, f.value)}
                    >
                      {busyKey === r.key + f.value ? "Generating…" : f.label}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
