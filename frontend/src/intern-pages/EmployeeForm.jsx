import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../intern-api/client";

const emptyForm = {
  employeeId: "", name: "", email: "", password: "", phone: "",
  department: "", facility: "", designation: "", joiningDate: "",
  emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelationship: "",
  status: "active",
};

export default function EmployeeForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [departments, setDepartments] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/departments", { limit: 100 }).then(({ data }) => setDepartments(data)).catch(() => {});
    api.get("/facilities", { limit: 100 }).then(({ data }) => setFacilities(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/employees/${id}`).then(({ data }) => {
      setForm({
        employeeId: data.employeeId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        department: data.department?._id || "",
        facility: data.facility?._id || "",
        designation: data.designation || "",
        joiningDate: data.joiningDate ? data.joiningDate.substring(0, 10) : "",
        emergencyContactName: data.emergencyContact?.name || "",
        emergencyContactPhone: data.emergencyContact?.phone || "",
        emergencyContactRelationship: data.emergencyContact?.relationship || "",
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

    const payload = {
      employeeId: form.employeeId,
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone,
      department: form.department || null,
      facility: form.facility || null,
      designation: form.designation,
      joiningDate: form.joiningDate || undefined,
      emergencyContact: {
        name: form.emergencyContactName,
        phone: form.emergencyContactPhone,
        relationship: form.emergencyContactRelationship,
      },
      status: form.status,
    };

    try {
      if (isEdit) {
        await api.put(`/employees/${id}`, payload);
      } else {
        await api.post("/employees", payload);
      }
      navigate("/employees");
    } catch (err) {
      setErrors(err.errors || [err.message]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-state">Loading employee…</div>;

  return (
    <div className="form-page">
      <h1>{isEdit ? "Edit Employee" : "Add Employee"}</h1>

      {errors.length > 0 && (
        <div className="alert alert-error">
          <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <label className="field">
            <span>Employee ID *</span>
            <input value={form.employeeId} onChange={(e) => update("employeeId", e.target.value)} required />
          </label>
          <label className="field">
            <span>Full Name *</span>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </label>
          <label className="field">
            <span>Email *</span>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          </label>
          <label className="field">
  <span>Temporary Password *</span>
  <input
    type="password"
    value={form.password}
    onChange={(e) => update("password", e.target.value)}
    minLength={8}
    autoComplete="new-password"
    required={!isEdit}
  />
</label>
          <label className="field">
            <span>Phone *</span>
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
          </label>
          <label className="field">
            <span>Department</span>
            <select value={form.department} onChange={(e) => update("department", e.target.value)}>
              <option value="">— None —</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Facility</span>
            <select value={form.facility} onChange={(e) => update("facility", e.target.value)}>
              <option value="">— None —</option>
              {facilities.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Designation</span>
            <input value={form.designation} onChange={(e) => update("designation", e.target.value)} />
          </label>
          <label className="field">
            <span>Joining Date</span>
            <input type="date" value={form.joiningDate} onChange={(e) => update("joiningDate", e.target.value)} />
          </label>
          <label className="field">
            <span>Status</span>
            <select value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>

        <h3 className="section-title">Emergency Contact</h3>
        <div className="form-grid">
          <label className="field">
            <span>Name</span>
            <input value={form.emergencyContactName} onChange={(e) => update("emergencyContactName", e.target.value)} />
          </label>
          <label className="field">
            <span>Phone</span>
            <input value={form.emergencyContactPhone} onChange={(e) => update("emergencyContactPhone", e.target.value)} />
          </label>
          <label className="field">
            <span>Relationship</span>
            <input value={form.emergencyContactRelationship} onChange={(e) => update("emergencyContactRelationship", e.target.value)} />
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/employees")}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
