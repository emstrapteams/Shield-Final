import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../intern-api/client";

const emptyForm = {
  program: "", facility: "", trainer: "", scheduledDate: "",
  startTime: "", endTime: "", status: "scheduled", notes: "",
};

export default function TrainingSessionForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState({ ...emptyForm, program: params.get("program") || "" });
  const [programs, setPrograms] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/training-programs", { limit: 100 }).then(({ data }) => setPrograms(data)).catch((err) => setErrors([err.message || "Failed to load training programs."]));
    api.get("/facilities", { limit: 100 }).then(({ data }) => setFacilities(data)).catch((err) => setErrors([err.message || "Failed to load facilities."]));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/training-sessions/${id}`).then(({ data }) => {
      setForm({
        program: data.program?._id || "", facility: data.facility?._id || "",
        trainer: data.trainer || "", scheduledDate: data.scheduledDate ? data.scheduledDate.substring(0, 10) : "",
        startTime: data.startTime || "", endTime: data.endTime || "", status: data.status, notes: data.notes || "",
      });
    }).catch((err) => {
      setLoadError(err.message || "Failed to load training session.");
    }).finally(() => setLoading(false));
  }, [id, isEdit]);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/training-sessions/${id}`, form);
        navigate(`/training-sessions/${id}`);
      } else {
        const { data } = await api.post("/training-sessions", form);
        navigate(`/training-sessions/${data._id}`);
      }
    } catch (err) {
      setErrors(err.errors || [err.message]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-state">Loading session…</div>;
  if (loadError) return <div className="alert alert-error" role="alert">{loadError} <button type="button" className="btn btn-ghost" onClick={() => navigate("/training-sessions")}>Back to Training Sessions</button></div>;

  return (
    <div className="form-page">
      <h1>{isEdit ? "Edit Training Session" : "Schedule Training Session"}</h1>

      {errors.length > 0 && <div className="alert alert-error"><ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <label className="field">
            <span>Training Program *</span>
            <select value={form.program} onChange={(e) => update("program", e.target.value)} required>
              <option value="">— Select —</option>
              {programs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
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
            <span>Trainer</span>
            <input value={form.trainer} onChange={(e) => update("trainer", e.target.value)} />
          </label>
          <label className="field">
            <span>Scheduled Date *</span>
            <input type="date" value={form.scheduledDate} onChange={(e) => update("scheduledDate", e.target.value)} required />
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
            <span>Notes</span>
            <textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/training-sessions")}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : isEdit ? "Save Changes" : "Schedule Session"}</button>
        </div>
      </form>
    </div>
  );
}
