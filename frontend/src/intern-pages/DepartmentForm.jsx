import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../intern-api/client";

export default function DepartmentForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", description: "", status: "active" });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/departments/${id}`).then(({ data }) => setForm(data)).finally(() => setLoading(false));
  }, [id, isEdit]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/departments/${id}`, form);
      } else {
        await api.post("/departments", form);
      }
      navigate("/departments");
    } catch (err) {
      setErrors(err.errors || [err.message]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-state">Loading department…</div>;

  return (
    <div className="form-page">
      <h1>{isEdit ? "Edit Department" : "Add Department"}</h1>

      {errors.length > 0 && (
        <div className="alert alert-error"><ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <label className="field">
            <span>Department Name *</span>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </label>
          <label className="field">
            <span>Status</span>
            <select value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="field field-wide">
            <span>Description</span>
            <textarea rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} />
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/departments")}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Department"}
          </button>
        </div>
      </form>
    </div>
  );
}
