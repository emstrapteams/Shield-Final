import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../intern-api/client";

const emptyForm = {
  facility: "", name: "", location: "", contentsStatus: "ready", refillRequired: false,
  installationDate: "", lastInspectionDate: "", nextInspectionDate: "", notes: "", status: "active",
};

export default function FirstAidKitForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [facilities, setFacilities] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/facilities", { limit: 100 }).then(({ data }) => setFacilities(data)).catch((err) => setErrors([err.message || "Failed to load facilities."]));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/first-aid-kits/${id}`).then(({ data }) => {
      setForm({
        facility: data.facility?._id || "",
        name: data.name,
        location: data.location || "",
        contentsStatus: data.firstAidKit?.contentsStatus || "ready",
        refillRequired: data.firstAidKit?.refillRequired || false,
        installationDate: data.installationDate ? data.installationDate.substring(0, 10) : "",
        lastInspectionDate: data.lastInspectionDate ? data.lastInspectionDate.substring(0, 10) : "",
        nextInspectionDate: data.nextInspectionDate ? data.nextInspectionDate.substring(0, 10) : "",
        notes: data.notes || "",
        status: data.status,
      });
    }).catch((err) => {
      setLoadError(err.message || "Failed to load first-aid kit.");
    }).finally(() => setLoading(false));
  }, [id, isEdit]);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      const payload = {
        facility: form.facility,
        name: form.name,
        location: form.location,
        installationDate: form.installationDate || undefined,
        lastInspectionDate: form.lastInspectionDate || undefined,
        nextInspectionDate: form.nextInspectionDate || undefined,
        notes: form.notes,
        status: form.status,
        firstAidKit: { contentsStatus: form.contentsStatus, refillRequired: form.refillRequired },
      };
      if (isEdit) {
        await api.put(`/first-aid-kits/${id}`, payload);
      } else {
        await api.post("/first-aid-kits", payload);
      }
      navigate("/first-aid-kits");
    } catch (err) {
      setErrors(err.errors || [err.message]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-state">Loading first-aid kit…</div>;
  if (loadError) return <div className="alert alert-error" role="alert">{loadError} <button type="button" className="btn btn-ghost" onClick={() => navigate("/first-aid-kits")}>Back to First-Aid Kits</button></div>;

  return (
    <div className="form-page">
      <h1>{isEdit ? "Edit First-Aid Kit" : "Add First-Aid Kit"}</h1>

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
            <input value={form.location} onChange={(e) => update("location", e.target.value)} />
          </label>
          <label className="field">
            <span>Contents Status</span>
            <select value={form.contentsStatus} onChange={(e) => update("contentsStatus", e.target.value)}>
              <option value="ready">Ready</option>
              <option value="needs_refill">Needs Refill</option>
              <option value="needs_attention">Needs Attention</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={form.refillRequired} onChange={(e) => update("refillRequired", e.target.checked)} style={{ width: "auto" }} />
            <span>Refill required</span>
          </label>
          <label className="field">
            <span>Equipment Status</span>
            <select value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="inspection_due">Inspection Due</option>
              <option value="overdue">Overdue</option>
              <option value="replacement_required">Replacement Required</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="field">
            <span>Installation Date</span>
            <input type="date" value={form.installationDate} onChange={(e) => update("installationDate", e.target.value)} />
          </label>
          <label className="field">
            <span>Last Inspection</span>
            <input type="date" value={form.lastInspectionDate} onChange={(e) => update("lastInspectionDate", e.target.value)} />
          </label>
          <label className="field">
            <span>Next Inspection</span>
            <input type="date" value={form.nextInspectionDate} onChange={(e) => update("nextInspectionDate", e.target.value)} />
          </label>
          <label className="field field-wide">
            <span>Notes</span>
            <textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/first-aid-kits")}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : isEdit ? "Save Changes" : "Add Kit"}</button>
        </div>
      </form>
    </div>
  );
}
