import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../intern-api/client";

const TYPES = ["fire_safety", "first_aid", "emergency_response", "industry_specific", "custom"];

const emptyForm = {
  name: "", type: "fire_safety", description: "", trainer: "",
  durationHours: "", requiredSessionsPerYear: "2", status: "active",
};

export default function TrainingProgramForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/training-programs/${id}`).then(({ data }) => {
      setForm({
        name: data.name, type: data.type, description: data.description || "",
        trainer: data.trainer || "", durationHours: data.durationHours ?? "",
        requiredSessionsPerYear: data.requiredSessionsPerYear ?? "2", status: data.status,
      });
    }).finally(() => setLoading(false));
  }, [id, isEdit]);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      const payload = {
        ...form,
        durationHours: form.durationHours === "" ? 0 : Number(form.durationHours),
        requiredSessionsPerYear: form.requiredSessionsPerYear === "" ? 2 : Number(form.requiredSessionsPerYear),
      };
      if (isEdit) {
        await api.put(`/training-programs/${id}`, payload);
      } else {
        await api.post("/training-programs", payload);
      }
      navigate("/training-programs");
    } catch (err) {
      setErrors(err.errors || [err.message]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-state">Loading program…</div>;

  return (
    <div className="form-page">
      <h1>{isEdit ? "Edit Training Program" : "Add Training Program"}</h1>

      {errors.length > 0 && <div className="alert alert-error"><ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <label className="field field-wide">
            <span>Program Name *</span>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </label>
          <label className="field">
            <span>Type *</span>
            <select value={form.type} onChange={(e) => update("type", e.target.value)}>
              {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Trainer</span>
            <input value={form.trainer} onChange={(e) => update("trainer", e.target.value)} />
          </label>
          <label className="field">
            <span>Duration (hours)</span>
            <input type="number" min="0" value={form.durationHours} onChange={(e) => update("durationHours", e.target.value)} />
          </label>
          <label className="field">
            <span>Required Sessions / Year</span>
            <input type="number" min="0" value={form.requiredSessionsPerYear} onChange={(e) => update("requiredSessionsPerYear", e.target.value)} />
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
            <textarea rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/training-programs")}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : isEdit ? "Save Changes" : "Add Program"}</button>
        </div>
      </form>
    </div>
  );
}
