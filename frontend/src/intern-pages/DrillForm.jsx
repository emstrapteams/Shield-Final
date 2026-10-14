import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../intern-api/client";

const TYPES = ["fire", "evacuation", "medical_emergency", "custom"];

const emptyForm = {
  facility: "", name: "", type: "fire", scenario: "", date: "",
  startTime: "", endTime: "", status: "scheduled",
};

export default function DrillForm() {
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
    api.get(`/drills/${id}`).then(({ data }) => {
      setForm({
        facility: data.facility?._id || "", name: data.name, type: data.type,
        scenario: data.scenario || "", date: data.date ? data.date.substring(0, 10) : "",
        startTime: data.startTime || "", endTime: data.endTime || "", status: data.status,
      });
    }).finally(() => setLoading(false));
  }, [id, isEdit]);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/drills/${id}`, form);
        navigate(`/drills/${id}`);
      } else {
        const { data } = await api.post("/drills", form);
        navigate(`/drills/${data._id}`);
      }
    } catch (err) {
      setErrors(err.errors || [err.message]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-state">Loading drill…</div>;

  return (
    <div className="form-page">
      <h1>{isEdit ? "Edit Drill" : "Schedule Emergency Drill"}</h1>

      {errors.length > 0 && <div className="alert alert-error"><ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <label className="field field-wide">
            <span>Drill Name *</span>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </label>
          <label className="field">
            <span>Type *</span>
            <select value={form.type} onChange={(e) => update("type", e.target.value)}>
              {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Facility *</span>
            <select value={form.facility} onChange={(e) => update("facility", e.target.value)} required>
              <option value="">— Select —</option>
              {facilities.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Date *</span>
            <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} required />
          </label>
          <label className="field">
            <span>Start Time</span>
            <input type="time" value={form.startTime} onChange={(e) => update("startTime", e.target.value)} />
          </label>
          <label className="field">
            <span>End Time</span>
            <input type="time" value={form.endTime} onChange={(e) => update("endTime", e.target.value)} />
          </label>
          <label className="field">
            <span>Status</span>
            <select value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label className="field field-wide">
            <span>Scenario</span>
            <textarea rows={3} value={form.scenario} onChange={(e) => update("scenario", e.target.value)} placeholder="Describe the drill scenario" />
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/drills")}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : isEdit ? "Save Changes" : "Schedule Drill"}</button>
        </div>
      </form>
    </div>
  );
}
