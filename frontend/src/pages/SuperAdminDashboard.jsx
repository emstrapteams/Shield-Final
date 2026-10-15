
import { useEffect, useState } from "react";
import logo from "../assets/logo.png";
import {
  getCompanies,
  createCompany,
  updateCompany,
  updateCompanyStatus,
  getCompanyAdmins,
  createCompanyAdmin,
} from "../services/companyService";
import { logoutUser } from "../services/authService";
import "./SuperAdminDashboard.css";

function SuperAdminDashboard({ user, onLogout }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);

  const [activeSection, setActiveSection] = useState("overview");
  const [saving, setSaving] = useState(false);
  const [adminSaving, setAdminSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Company form state
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  // Company Admin form state
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminCompanyId, setAdminCompanyId] = useState("");

  const fetchCompanies = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getCompanies();

      // Support either { companies: [] } or { data: { companies: [] } }
      const list =
        response?.data?.companies ??
        response?.companies ??
        response?.data?.data?.companies ??
        [];

      setCompanies(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load companies."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    setAdminsLoading(true);
    setError("");

    try {
      const response = await getCompanyAdmins();

      // Controller returns { success, data: { admins } }
      const list =
        response?.data?.admins ??
        response?.admins ??
        response?.data?.data?.admins ??
        [];

      setAdmins(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load Company Admins."
      );
    } finally {
      setAdminsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (activeSection === "administrators") {
      fetchAdmins();
    }
  }, [activeSection]);

  // Company form functions
  const resetForm = () => {
    setName("");
    setCode("");
    setEditingCompany(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setEditingCompany(null);
    setName("");
    setCode("");
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (company) => {
    setEditingCompany(company);
    setName(company.name);
    setCode(company.code);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingCompany) {
        await updateCompany(editingCompany._id, {
          name: name.trim(),
          code: code.trim(),
        });

        setSuccess("Company updated successfully.");
      } else {
        await createCompany({
          name: name.trim(),
          code: code.trim(),
        });

        setSuccess("Company created successfully.");
      }

      resetForm();
      await fetchCompanies();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save company."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (company) => {
    const nextStatus =
      company.status === "active" ? "suspended" : "active";

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus === "active" ? "activate" : "suspend"
      } ${company.name}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await updateCompanyStatus(company._id, nextStatus);
      setSuccess(`${company.name} is now ${nextStatus}.`);
      await fetchCompanies();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update status."
      );
    }
  };

  // Company Admin form functions
  const openAdminForm = () => {
    setAdminName("");
    setAdminEmail("");
    setAdminPassword("");
    setAdminCompanyId("");
    setError("");
    setSuccess("");
    setShowAdminForm(true);
  };

  const closeAdminForm = () => {
    if (adminSaving) return;

    setShowAdminForm(false);
    setAdminName("");
    setAdminEmail("");
    setAdminPassword("");
    setAdminCompanyId("");
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!adminCompanyId) {
      setError("Please select a company.");
      return;
    }

    if (adminPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setAdminSaving(true);

    try {
      await createCompanyAdmin(adminCompanyId, {
        name: adminName.trim(),
        email: adminEmail.trim().toLowerCase(),
        password: adminPassword,
      });

      setShowAdminForm(false);
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      setAdminCompanyId("");

      setSuccess("Company Admin created successfully.");

      await fetchAdmins();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create Company Admin."
      );
    } finally {
      setAdminSaving(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    onLogout();
  };

  const activeCount = companies.filter(
    (company) => company.status === "active"
  ).length;

  const suspendedCount = companies.filter(
    (company) => company.status === "suspended"
  ).length;

  const sectionTitles = {
    overview: "Super Admin Overview",
    companies: "Company Management",
    administrators: "Administrator Management",
    settings: "Platform Settings",
  };

  const selectSection = (section) => {
    setActiveSection(section);
    setError("");
    setSuccess("");
  };

  const activeCompanies = companies.filter(
    (company) => company.status === "active"
  );

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <img
            src={logo}
            alt="EMSTRAP Logo"
            className="sidebar-logo"
          />

          <div>
            <strong>EMSTRAP</strong>
            <span>Shield</span>
          </div>
        </div>

        <div className="sidebar-section-label">MAIN MENU</div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${
              activeSection === "overview" ? "active" : ""
            }`}
            onClick={() => selectSection("overview")}
          >
            <span>▦</span>
            Overview
          </button>

          <button
            className={`nav-item ${
              activeSection === "companies" ? "active" : ""
            }`}
            onClick={() => selectSection("companies")}
          >
            <span>▤</span>
            Companies
          </button>

          <button
            className={`nav-item ${
              activeSection === "administrators" ? "active" : ""
            }`}
            onClick={() => selectSection("administrators")}
          >
            <span>♙</span>
            Administrators
          </button>

          <button
            className={`nav-item ${
              activeSection === "settings" ? "active" : ""
            }`}
            onClick={() => selectSection("settings")}
          >
            <span>⚙</span>
            Settings
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>

            <div className="user-info">
              <strong>{user?.name}</strong>
              <span>Super Admin</span>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <span className="header-eyebrow">WORKSPACE</span>
            <h1>{sectionTitles[activeSection]}</h1>
          </div>

          <div className="header-profile">
            <div className="header-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{user?.name}</strong>
              <span>Super Admin</span>
            </div>
          </div>
        </header>

        <section className="admin-content">
          {/* Alerts */}
          {error && (
            <div className="dashboard-alert error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="dashboard-alert success" role="status">
              {success}
            </div>
          )}

          {/* Overview */}
          {activeSection === "overview" && (
            <>
              <div className="welcome-row">
                <div>
                  <h2>
                    Welcome back, {user?.name?.split(" ")[0]}.
                  </h2>
                  <p>
                    Manage organizations and platform access.
                  </p>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon total">▤</div>
                  <span>Total Companies</span>
                  <strong>{companies.length}</strong>
                  <small>Registered organizations</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon active-icon">✓</div>
                  <span>Active Companies</span>
                  <strong>{activeCount}</strong>
                  <small>Currently active</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon suspended-icon">Ⅱ</div>
                  <span>Suspended Companies</span>
                  <strong>{suspendedCount}</strong>
                  <small>Access suspended</small>
                </div>
              </div>
            </>
          )}

          {/* Companies */}
          {activeSection === "companies" && (
            <>
              <div className="welcome-row">
                <div>
                  <h2>Company Management</h2>
                  <p>
                    Create, view, and manage registered organizations.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={openCreateForm}
                >
                  + Add Company
                </button>
              </div>

              <section className="companies-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Registered Companies</h3>
                    <p>
                      View and manage registered organizations.
                    </p>
                  </div>

                  <button
                    className="secondary-button"
                    onClick={fetchCompanies}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "↻ Refresh"}
                  </button>
                </div>

                {loading ? (
                  <div className="empty-state">
                    Loading companies...
                  </div>
                ) : companies.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">▤</div>
                    <h4>No companies yet</h4>
                    <p>
                      Create your first company to get started.
                    </p>
                    <button
                      className="primary-button"
                      onClick={openCreateForm}
                    >
                      + Add Company
                    </button>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="companies-table">
                      <thead>
                        <tr>
                          <th>Company</th>
                          <th>Company Code</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {companies.map((company) => (
                          <tr key={company._id}>
                            <td>
                              <div className="company-name">
                                <div className="company-avatar">
                                  {company.name
                                    ?.charAt(0)
                                    .toUpperCase()}
                                </div>
                                <strong>{company.name}</strong>
                              </div>
                            </td>

                            <td>
                              <span className="company-code">
                                {company.code}
                              </span>
                            </td>

                            <td>
                              <span
                                className={`status-badge ${company.status}`}
                              >
                                {company.status}
                              </span>
                            </td>

                            <td>
                              {company.createdAt
                                ? new Date(
                                    company.createdAt
                                  ).toLocaleDateString()
                                : "—"}
                            </td>

                            <td>
                              <div className="table-actions">
                                <button
                                  className="edit-action"
                                  onClick={() =>
                                    openEditForm(company)
                                  }
                                >
                                  Edit
                                </button>

                                {company.status !== "deactivated" && (
                                  <button
                                    className="status-action"
                                    onClick={() =>
                                      handleStatusChange(company)
                                    }
                                  >
                                    {company.status === "active"
                                      ? "Suspend"
                                      : "Activate"}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {/* Administrators */}
          {activeSection === "administrators" && (
            <section className="companies-panel">
              <div className="panel-heading">
                <div>
                  <h3>Company Administrators</h3>
                  <p>
                    View and manage Company Admin accounts across
                    registered organizations.
                  </p>
                </div>

                <div className="table-actions">
                  <button
                    className="primary-button"
                    onClick={openAdminForm}
                    disabled={activeCompanies.length === 0}
                    title={
                      activeCompanies.length === 0
                        ? "Create an active company first"
                        : "Create a Company Admin"
                    }
                  >
                    + Add Administrator
                  </button>

                  <button
                    className="secondary-button"
                    onClick={fetchAdmins}
                    disabled={adminsLoading}
                  >
                    {adminsLoading ? "Loading..." : "↻ Refresh"}
                  </button>
                </div>
              </div>

              {activeCompanies.length === 0 && (
                <div className="empty-state">
                  No active companies are available. Create or activate
                  a company before adding an administrator.
                </div>
              )}

              {adminsLoading ? (
                <div className="empty-state">
                  Loading Company Admins...
                </div>
              ) : admins.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">♙</div>
                  <h4>No Company Admins found</h4>
                  <p>
                    Create a Company Admin account to give an
                    organization access to Shield.
                  </p>
                  {activeCompanies.length > 0 && (
                    <button
                      className="primary-button"
                      onClick={openAdminForm}
                    >
                      + Add Administrator
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="companies-table">
                    <thead>
                      <tr>
                        <th>Administrator</th>
                        <th>Email</th>
                        <th>Company</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>

                    <tbody>
                      {admins.map((admin) => (
                        <tr key={admin._id || admin.id}>
                          <td>
                            <div className="company-name">
                              <div className="company-avatar">
                                {admin.name
                                  ?.charAt(0)
                                  .toUpperCase()}
                              </div>
                              <strong>{admin.name || "—"}</strong>
                            </div>
                          </td>

                          <td>{admin.email || "—"}</td>

                          <td>
                            {typeof admin.company === "object"
                              ? admin.company?.name || "—"
                              : companies.find(
                                  (company) =>
                                    company._id === admin.company
                                )?.name || "—"}
                          </td>

                          <td>
                            <span
                              className={`status-badge ${
                                admin.status || "inactive"
                              }`}
                            >
                              {admin.status || "Unknown"}
                            </span>
                          </td>

                          <td>
                            {admin.createdAt
                              ? new Date(
                                  admin.createdAt
                                ).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Settings */}
          {activeSection === "settings" && (
            <section className="companies-panel">
              <div className="panel-heading">
                <div>
                  <h3>Platform Settings</h3>
                  <p>
                    Configure your EMSTRAP Shield platform.
                  </p>
                </div>
              </div>

              <div className="empty-state">
                <div className="empty-icon">⚙</div>
                <h4>Platform Settings</h4>
                <p>
                  Platform configuration and account preferences
                  will be implemented here.
                </p>
              </div>
            </section>
          )}
        </section>
      </main>

      {/* Create / Edit Company Modal */}
      {showForm && (
        <div className="modal-overlay">
          <section
            className="company-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="company-modal-title"
          >
            <div className="modal-heading">
              <div>
                <h3 id="company-modal-title">
                  {editingCompany ? "Edit Company" : "Create Company"}
                </h3>
                <p>
                  {editingCompany
                    ? "Update organization details."
                    : "Add a new organization to EMSTRAP Shield."}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={resetForm}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="company-name">Company Name</label>
                <input
                  id="company-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter company name"
                  required
                  maxLength={120}
                />
              </div>

              <div className="form-group">
                <label htmlFor="company-code">Company Code</label>
                <input
                  id="company-code"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.toUpperCase())
                  }
                  placeholder="e.g. ACME001"
                  required
                  maxLength={30}
                />
                <small>
                  Use a unique code to identify this organization.
                </small>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingCompany
                      ? "Save Changes"
                      : "Create Company"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Create Company Admin Modal */}
      {showAdminForm && (
        <div className="modal-overlay">
          <section
            className="company-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
          >
            <div className="modal-heading">
              <div>
                <h3 id="admin-modal-title">
                  Create Company Admin
                </h3>
                <p>
                  Create login credentials for a company administrator.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeAdminForm}
                disabled={adminSaving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateAdmin}>
              <div className="form-group">
                <label htmlFor="admin-name">Full Name</label>
                <input
                  id="admin-name"
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Enter full name"
                  required
                  maxLength={120}
                  autoComplete="name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="admin-email">Email Address</label>
                <input
                  id="admin-email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@company.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="admin-password">
                  Initial Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) =>
                    setAdminPassword(e.target.value)
                  }
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
                <small>
                  Use a strong password and share it securely with the
                  administrator.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="admin-company">Company</label>
                <select
                  id="admin-company"
                  value={adminCompanyId}
                  onChange={(e) =>
                    setAdminCompanyId(e.target.value)
                  }
                  required
                >
                  <option value="">Select a company</option>
                  {activeCompanies.map((company) => (
                    <option
                      key={company._id}
                      value={company._id}
                    >
                      {company.name} ({company.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeAdminForm}
                  disabled={adminSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={adminSaving || activeCompanies.length === 0}
                >
                  {adminSaving
                    ? "Creating..."
                    : "Create Administrator"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default SuperAdminDashboard;
