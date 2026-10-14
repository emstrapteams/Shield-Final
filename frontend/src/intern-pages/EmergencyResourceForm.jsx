import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../intern-api/client";

const INTERNAL_TYPES = ["security_team", "safety_team", "first_responders", "company_ambulance", "emergency_contact"];
const EXTERNAL_TYPES = ["ambulance_provider", "hospital", "fire_response_provider", "other_emergency_service"];

const emptyForm = {
  category: "internal", serviceType: "security_team", name: "",
  contactPerson: "", phone: "", email: "", location: "", coverageArea: "",
  availability: "", priority: 3, integrationStatus: "not_integrated", status: "active", notes: "",
};

export default function EmergencyResourceForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/emergency-resources/${id}`).then(({ data }) => {
      setForm({
        category: data.category, serviceType: data.serviceType, name: data.name,
        contactPerson: data.contact?.contactPerson || "", phone: data.contact?.phone || "", email: data.contact?.email || "",
        location: data.location || "", coverageArea: data.coverageArea || "", availability: data.availability || "",
        priority: data.priority, integrationStatus: data.integrationStatus, status: data.status, notes: data.notes || "",
      });
    }).finally(() => setLoading(false));
  }, [id, isEdit]);

  function update(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === "category") next.serviceType = value === "internal" ? INTERNAL_TYPES[0] : EXTERNAL_TYPES[0];
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      const payload = {
        category: form.category, serviceType: form.serviceType, name: form.name,
        contact: { contactPerson: form.contactPerson, phone: form.phone, email: form.email },
        location: form.location, coverageArea: form.coverageArea, availability: form.availability,
        priority: Number(form.priority), integrationStatus: form.integrationStatus, status: form.status, notes: form.notes,
      };
      if (isEdit) {
        await api.put(`/emergency-resources/${id}`, payload);
      } else {
        await api.post("/emergency-resources", payload);
      }
      navigate("/emergency-resources");
    } catch (err) {
      setErrors(err.errors || [err.message]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-state">Loading resource…</div>;

  const typeOptions = form.category === "internal" ? INTERNAL_TYPES : EXTERNAL_TYPES;

  return (
    <div className="form-page">
      <h1>{isEdit ? "Edit Emergency Resource" : "Add Emergency Resource"}</h1>
      <p className="page-sub" style={{ marginBottom: 14 }}>Configuration only — this does not trigger, route, or dispatch anything.</p>

      {errors.length > 0 && <div className="alert alert-error"><ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <label className="field field-wide">
            <span>Name *</span>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </label>
          <label className="field">
            <span>Category *</span>
            <select value={form.category} onChange={(e) => update("category", e.target.value)}>
              <option value="internal">Internal</option>
              <option value="external">External</option>
            </select>
          </label>
          <label className="field">
            <span>Service Type *</span>
            <select value={form.serviceType} onChange={(e) => update("serviceType", e.target.value)}>
              {typeOptions.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Contact Person</span>
            <input value={form.contactPerson} onChange={(e) => update("contactPerson", e.target.value)} />
          </label>
          <label className="field">
            <span>Phone</span>
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </label>
          <label className="field">
            <span>Location</span>
            <input value={form.location} onChange={(e) => update("location", e.target.value)} />
          </label>
          <label className="field">
            <span>Coverage Area</span>
            <input value={form.coverageArea} onChange={(e) => update("coverageArea", e.target.value)} placeholder="e.g. 10km radius" />
          </label>
          <label className="field">
            <span>Availability</span>
            <input value={form.availability} onChange={(e) => update("availability", e.target.value)} placeholder="e.g. 24x7" />
          </label>
          <label className="field">
            <span>Priority (1 = highest)</span>
            <input type="number" min="1" max="5" value={form.priority} onChange={(e) => update("priority", e.target.value)} />
          </label>
          <label className="field">
            <span>Integration Status</span>
            <select value={form.integrationStatus} onChange={(e) => update("integrationStatus", e.target.value)}>
              <option value="not_integrated">Not Integrated</option>
              <option value="in_progress">In Progress</option>
              <option value="integrated">Integrated</option>
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="field field-wide">
            <span>Notes</span>
            <textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/emergency-resources")}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : isEdit ? "Save Changes" : "Add Resource"}</button>
        </div>
      </form>
    </div>
  );
}
