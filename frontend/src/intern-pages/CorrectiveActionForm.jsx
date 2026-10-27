import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../intern-api/client";

const emptyForm = {
  sourceType: "safety_issue", title: "", description: "", assignedTeam: "",
  priority: "medium", dueDate: "", status: "pending",
};

export default function CorrectiveActionForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/corrective-actions/${id}`).then(({ data }) => {
      setForm({
        sourceType: data.sourceType,
        title: data.title,
        description: data.description || "",
        assignedTeam: data.assignedTeam || "",
        priority: data.priority,
        dueDate: data.dueDate ? data.dueDate.substring(0, 10) : "",
        status: data.status,
      });
    }).catch((err) => {
      setLoadError(err.message || "Failed to load corrective action.");
    }).finally(() => setLoading(false));
  }, [id, isEdit]);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      const payload = { ...form, dueDate: form.dueDate || undefined };
      if (isEdit) {
        await api.put(`/corrective-actions/${id}`, payload);
      } else {
        await api.post("/corrective-actions", payload);
      }
      navigate("/corrective-actions");
    } catch (err) {
      setErrors(err.errors || [err.message]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-state">Loading corrective action…</div>;
  if (loadError) {
    return (
      <div>
        <div className="alert alert-error" role="alert">{loadError}</div>
        <button type="button" className="btn btn-ghost" onClick={() => navigate("/corrective-actions")}>
          Back to Corrective Actions
        </button>
      </div>
    );
  }

  return (
    <div className="form-page">
      <h1>{isEdit ? "Edit Corrective Action" : "Add Corrective Action"}</h1>

      {errors.length > 0 && <div className="alert alert-error"><ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <label className="field field-wide">
            <span>Title *</span>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} required />
          </label>
          <label className="field">
            <span>Source Type *</span>
            <select value={form.sourceType} onChange={(e) => update("sourceType", e.target.value)}>
              <option value="inspection">Inspection</option>
              <option value="equipment">Equipment</option>
              <option value="drill">Emergency Drill</option>
              <option value="safety_issue">Safety Issue</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="field">
            <span>Priority</span>
            <select value={form.priority} onChange={(e) => update("priority", e.target.value)}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
            </select>
          </label>
          <label className="field">
            <span>Assigned Team / Person</span>
            <input value={form.assignedTeam} onChange={(e) => update("assignedTeam", e.target.value)} placeholder="e.g. Facilities Team" />
          </label>
          <label className="field">
            <span>Due Date</span>
            <input type="date" value={form.dueDate} onChange={(e) => update("dueDate", e.target.value)} />
          </label>
          <label className="field">
            <span>Status</span>
            <select value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="pending">Pending</option><option value="in_progress">In Progress</option>
              <option value="completed">Completed</option><option value="overdue">Overdue</option><option value="verified">Verified</option>
            </select>
          </label>
          <label className="field field-wide">
            <span>Description</span>
            <textarea rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} />
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/corrective-actions")}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : isEdit ? "Save Changes" : "Add Action"}</button>
        </div>
      </form>
    </div>
  );
}
