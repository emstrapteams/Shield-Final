import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../intern-api/client";

const RESULT_OPTIONS = [
  { value: "pass", label: "Pass" },
  { value: "fail", label: "Fail" },
  { value: "needs_attention", label: "Needs Attention" },
  { value: "not_applicable", label: "N/A" },
];

// Default configurable checklist starting point — the person can add,
// remove, or rename items freely; this is not a hardcoded requirement.
const DEFAULT_CHECKLIST = [
  { item: "Physical condition / no visible damage", result: "pass", notes: "" },
  { item: "Accessible and unobstructed", result: "pass", notes: "" },
  { item: "Signage / labeling intact", result: "pass", notes: "" },
];

export default function InspectionForm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const preselectedEquipment = params.get("equipment") || "";

  const [equipmentList, setEquipmentList] = useState([]);
  const [equipment, setEquipment] = useState(preselectedEquipment);
  const [inspectorName, setInspectorName] = useState("");
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().substring(0, 10));
  const [nextInspectionDate, setNextInspectionDate] = useState("");
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST.map((c) => ({ ...c })));
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/equipment", { limit: 200 }).then(({ data }) => setEquipmentList(data)).catch(() => {});
  }, []);

  function updateChecklistItem(index, field, value) {
    setChecklist((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }
  function addChecklistItem() {
    setChecklist((rows) => [...rows, { item: "", result: "pass", notes: "" }]);
  }
  function removeChecklistItem(index) {
    setChecklist((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      const payload = {
        equipment,
        inspectorName,
        inspectionDate,
        nextInspectionDate: nextInspectionDate || undefined,
        notes,
        checklist,
      };
      const { data } = await api.post("/inspections", payload);
      navigate(`/inspections/${data._id}`);
    } catch (err) {
      setErrors(err.errors || [err.message]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form-page">
      <h1>New Inspection</h1>

      {errors.length > 0 && <div className="alert alert-error"><ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <label className="field field-wide">
            <span>Equipment *</span>
            <select value={equipment} onChange={(e) => setEquipment(e.target.value)} required>
              <option value="">— Select equipment —</option>
              {equipmentList.map((e) => (
                <option key={e._id} value={e._id}>{e.name} ({e.type.replace(/_/g, " ")})</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Inspector Name</span>
            <input value={inspectorName} onChange={(e) => setInspectorName(e.target.value)} placeholder="e.g. Ramesh Kumar" />
          </label>
          <label className="field">
            <span>Inspection Date *</span>
            <input type="date" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} required />
          </label>
          <label className="field">
            <span>Next Inspection Date</span>
            <input type="date" value={nextInspectionDate} onChange={(e) => setNextInspectionDate(e.target.value)} />
          </label>
        </div>

        <h3 className="section-title">Checklist</h3>
        <p className="page-sub" style={{ marginBottom: 10 }}>
          Configurable — add or remove items as needed. The overall result is derived automatically: any "Fail" makes the inspection Failed, any "Needs Attention" (with no fails) makes it Needs Attention, otherwise it's Passed.
        </p>
        {checklist.map((row, i) => (
          <div className="checklist-row" key={i}>
            <input
              className="input"
              placeholder="Checklist item"
              value={row.item}
              onChange={(e) => updateChecklistItem(i, "item", e.target.value)}
              required
            />
            <select className="input" value={row.result} onChange={(e) => updateChecklistItem(i, "result", e.target.value)}>
              {RESULT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input
              className="input"
              placeholder="Notes (optional)"
              value={row.notes}
              onChange={(e) => updateChecklistItem(i, "notes", e.target.value)}
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeChecklistItem(i)} disabled={checklist.length <= 1}>Remove</button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={addChecklistItem} style={{ marginTop: 6 }}>+ Add Checklist Item</button>

        <h3 className="section-title">Notes</h3>
        <textarea rows={3} className="input" style={{ width: "100%" }} value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Submit Inspection"}</button>
        </div>
      </form>
    </div>
  );
}
