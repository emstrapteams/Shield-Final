import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../intern-api/client";

const CATEGORIES = ["fire_safety", "medical", "emergency_infrastructure", "other"];
const TYPES = [
  "fire_extinguisher", "fire_alarm", "fire_hydrant", "sprinkler", "fire_blanket",
  "first_aid_kit", "aed", "stretcher", "emergency_exit", "emergency_light",
  "assembly_point", "other",
];

const emptyForm = {
  facility: "", category: "fire_safety", type: "fire_alarm", name: "", location: "",
  installationDate: "", lastInspectionDate: "", nextInspectionDate: "",
  inspectionIntervalDays: "", dueWindowDays: "30", notes: "", status: "active",
};

export default function EquipmentForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [facilities, setFacilities] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/facilities", { limit: 100 }).then(({ data }) => setFacilities(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/equipment/${id}`).then(({ data }) => {
      setForm({
        facility: data.facility?._id || "",
        category: data.category,
        type: data.type,
        name: data.name,
        location: data.location || "",
        installationDate: data.installationDate ? data.installationDate.substring(0, 10) : "",
        lastInspectionDate: data.lastInspectionDate ? data.lastInspectionDate.substring(0, 10) : "",
        nextInspectionDate: data.nextInspectionDate ? data.nextInspectionDate.substring(0, 10) : "",
        inspectionIntervalDays: data.inspectionIntervalDays ?? "",
        dueWindowDays: data.dueWindowDays ?? "30",
        notes: data.notes || "",
        status: data.status,
      });
    }).finally(() => setLoading(false));
  }, [id, isEdit]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      const payload = {
        ...form,
        inspectionIntervalDays: form.inspectionIntervalDays === "" ? null : Number(form.inspectionIntervalDays),
        dueWindowDays: form.dueWindowDays === "" ? 30 : Number(form.dueWindowDays),
        installationDate: form.installationDate || undefined,
        lastInspectionDate: form.lastInspectionDate || undefined,
        nextInspectionDate: form.nextInspectionDate || undefined,
      };
      if (isEdit) {
        await api.put(`/equipment/${id}`, payload);
      } else {
        await api.post("/equipment", payload);
      }
      navigate("/equipment");
    } catch (err) {
      setErrors(err.errors || [err.message]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-state">Loading equipment…</div>;

  return (
    <div className="form-page">
      <h1>{isEdit ? "Edit Equipment" : "Add Equipment"}</h1>

      {errors.length > 0 && <div className="alert alert-error"><ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <label className="field field-wide">
            <span>Name *</span>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </label>
          <label className="field">
            <span>Facility *</span>
            <select value={form.facility} onChange={(e) => update("facility", e.target.value)} required>
              <option value="">— Select —</option>
              {facilities.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Location</span>
            <input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="e.g. Building A, Floor 2" />
          </label>
          <label className="field">
            <span>Category *</span>
            <select value={form.category} onChange={(e) => update("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Type *</span>
            <select value={form.type} onChange={(e) => update("type", e.target.value)}>
              {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Installation Date</span>
            <input type="date" value={form.installationDate} onChange={(e) => update("installationDate", e.target.value)} />
          </label>
          <label className="field">
            <span>Last Inspection Date</span>
            <input type="date" value={form.lastInspectionDate} onChange={(e) => update("lastInspectionDate", e.target.value)} />
          </label>
          <label className="field">
            <span>Next Inspection Date</span>
            <input type="date" value={form.nextInspectionDate} onChange={(e) => update("nextInspectionDate", e.target.value)} />
          </label>
          <label className="field">
            <span>Inspection Interval (days)</span>
            <input type="number" value={form.inspectionIntervalDays} onChange={(e) => update("inspectionIntervalDays", e.target.value)} placeholder="Optional, configurable" />
          </label>
          <label className="field">
            <span>Due-Soon Warning Window (days)</span>
            <input type="number" value={form.dueWindowDays} onChange={(e) => update("dueWindowDays", e.target.value)} />
          </label>
          <label className="field">
            <span>Status</span>
            <select value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="inspection_due">Inspection Due</option>
              <option value="overdue">Overdue</option>
              <option value="replacement_required">Replacement Required</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="field field-wide">
            <span>Notes</span>
            <textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/equipment")}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : isEdit ? "Save Changes" : "Add Equipment"}</button>
        </div>
      </form>
    </div>
  );
}
