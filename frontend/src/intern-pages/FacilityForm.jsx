import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../intern-api/client";

const emptyForm = {
  name: "", address: "", city: "", state: "", country: "",
  latitude: "", longitude: "", status: "active",
};

export default function FacilityForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/facilities/${id}`).then(({ data }) => {
      setForm({
        name: data.name, address: data.address || "", city: data.city || "",
        state: data.state || "", country: data.country || "",
        latitude: data.latitude ?? "", longitude: data.longitude ?? "",
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
        latitude: form.latitude === "" ? undefined : Number(form.latitude),
        longitude: form.longitude === "" ? undefined : Number(form.longitude),
      };
      if (isEdit) {
        await api.put(`/facilities/${id}`, payload);
      } else {
        await api.post("/facilities", payload);
      }
      navigate("/facilities");
    } catch (err) {
      setErrors(err.errors || [err.message]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-state">Loading facility…</div>;

  return (
    <div className="form-page">
      <h1>{isEdit ? "Edit Facility" : "Add Facility"}</h1>

      {errors.length > 0 && (
        <div className="alert alert-error"><ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <label className="field field-wide">
            <span>Facility Name *</span>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </label>
          <label className="field field-wide">
            <span>Address</span>
            <input value={form.address} onChange={(e) => update("address", e.target.value)} />
          </label>
          <label className="field">
            <span>City</span>
            <input value={form.city} onChange={(e) => update("city", e.target.value)} />
          </label>
          <label className="field">
            <span>State</span>
            <input value={form.state} onChange={(e) => update("state", e.target.value)} />
          </label>
          <label className="field">
            <span>Country</span>
            <input value={form.country} onChange={(e) => update("country", e.target.value)} />
          </label>
          <label className="field">
            <span>Status</span>
            <select value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="field">
            <span>Latitude</span>
            <input type="number" step="any" value={form.latitude} onChange={(e) => update("latitude", e.target.value)} />
          </label>
          <label className="field">
            <span>Longitude</span>
            <input type="number" step="any" value={form.longitude} onChange={(e) => update("longitude", e.target.value)} />
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/facilities")}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Facility"}
          </button>
        </div>
      </form>
    </div>
  );
}
