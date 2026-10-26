import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../intern-api/client";
import Dashboard from "../intern-pages/Dashboard";
import Reports from "../intern-pages/Reports";
import "./SuperAdminCompanyDashboardView.css";

const TABS = [
  { id: "overview", label: "Overview", icon: "▦" },
  { id: "safetyDashboard", label: "Safety Dashboard", icon: "📊" },
  { id: "emergencies", label: "Emergencies & Incidents", icon: "⚠" },
  { id: "employees", label: "Employees", icon: "👥" },
  { id: "departments", label: "Departments", icon: "🏢" },
  { id: "facilities", label: "Facilities", icon: "📍" },
  { id: "equipment", label: "Safety Equipment", icon: "⚙" },
  { id: "fireExtinguishers", label: "Fire Extinguishers", icon: "♨" },
  { id: "firstAidKits", label: "First-Aid Kits", icon: "✚" },
  { id: "inspections", label: "Safety Inspections", icon: "✓" },
  { id: "correctiveActions", label: "Corrective Actions", icon: "↗" },
  { id: "emergencyResources", label: "Emergency Resources", icon: "🚑" },
  { id: "drills", label: "Emergency Drills", icon: "⚑" },
  { id: "trainingPrograms", label: "Training Programs", icon: "📚" },
  { id: "trainingSessions", label: "Training Sessions", icon: "🎓" },
  { id: "reports", label: "Reports & Analytics", icon: "📑" },
];

const formatStatus = (status = "") =>
  status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString();
};

export default function SuperAdminCompanyDashboardView({ company, onBack }) {
  const companyId = company?._id;
  const [activeTab, setActiveTab] = useState("overview");
  const [safetyDashboardRefreshKey, setSafetyDashboardRefreshKey] = useState(0);
  const [reportsRefreshKey, setReportsRefreshKey] = useState(0);
  const overviewRequestId = useRef(0);
  const emergenciesRequestId = useRef(0);
  const itemsRequestId = useRef(0);
  const optionsRequestId = useRef(0);

  // Overview stats & company info
  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");

  // Emergencies state
  const [emergencies, setEmergencies] = useState([]);
  const [emergencySearch, setEmergencySearch] = useState("");
  const [emergencyStatus, setEmergencyStatus] = useState("");
  const [emergencyType, setEmergencyType] = useState("");
  const [emergenciesLoading, setEmergenciesLoading] = useState(false);
  const [emergenciesError, setEmergenciesError] = useState("");
  const [selectedEmergency, setSelectedEmergency] = useState(null);

  // Generic collection state for list modules
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState("");
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });

  // Filters for list modules
  const [search, setSearch] = useState("");
  const [filter1, setFilter1] = useState("");
  const [filter2, setFilter2] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Common detail modal state
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [detailModalType, setDetailModalType] = useState("");

  // Helper options (departments, facilities, etc.)
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [facilityOptions, setFacilityOptions] = useState([]);
  const [optionsError, setOptionsError] = useState("");

  // Ensure active company ID is placed in sessionStorage for client.js / emergencyService
  useEffect(() => {
    if (companyId) {
      sessionStorage.setItem("shield_active_company_id", companyId);
    }

    return () => {
      sessionStorage.removeItem("shield_active_company_id");
      overviewRequestId.current += 1;
      emergenciesRequestId.current += 1;
      itemsRequestId.current += 1;
      optionsRequestId.current += 1;
    };
  }, [companyId]);

  // Load Overview Data
  const loadOverview = useCallback(async () => {
    if (!companyId) return;
    const requestId = ++overviewRequestId.current;
    setOverviewLoading(true);
    setOverviewError("");
    try {
      const res = await api.get(`/super-admin/companies/${companyId}/overview`);
      if (!res.data?.company || !res.data?.summary) {
        throw new Error("The server returned an unexpected company overview.");
      }
      if (requestId === overviewRequestId.current) {
        setOverviewData(res.data);
      }
    } catch (err) {
      if (requestId === overviewRequestId.current) {
        setOverviewData(null);
        setOverviewError(err.message || "Failed to load company overview.");
      }
    } finally {
      if (requestId === overviewRequestId.current) {
        setOverviewLoading(false);
      }
    }
  }, [companyId]);

  // Load Emergencies
  const loadEmergencies = useCallback(async () => {
    if (!companyId) return;
    const requestId = ++emergenciesRequestId.current;
    setEmergenciesLoading(true);
    setEmergenciesError("");
    try {
      const res = await api.get(`/super-admin/companies/${companyId}/emergencies`);
      const list = res.data?.emergencies;
      if (!Array.isArray(list)) {
        throw new Error("The server returned an unexpected emergencies response.");
      }
      if (requestId === emergenciesRequestId.current) {
        setEmergencies(list);
      }
    } catch (err) {
      if (requestId === emergenciesRequestId.current) {
        setEmergencies([]);
        setEmergenciesError(err.message || "Failed to load emergencies.");
      }
    } finally {
      if (requestId === emergenciesRequestId.current) {
        setEmergenciesLoading(false);
      }
    }
  }, [companyId]);

  const loadFilterOptions = useCallback(async () => {
    if (!companyId) return;
    const requestId = ++optionsRequestId.current;
    try {
      const [departments, facilities] = await Promise.all([
        api.get("/departments", { limit: 100 }),
        api.get("/facilities", { limit: 100 }),
      ]);
      if (!Array.isArray(departments.data) || !Array.isArray(facilities.data)) {
        throw new Error("The server returned unexpected department or facility data.");
      }
      if (requestId === optionsRequestId.current) {
        setOptionsError("");
        setDepartmentOptions(departments.data);
        setFacilityOptions(facilities.data);
      }
    } catch (err) {
      if (requestId === optionsRequestId.current) {
        setDepartmentOptions([]);
        setFacilityOptions([]);
        setOptionsError(err.message || "Failed to load department and facility options.");
      }
    }
  }, [companyId]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) loadFilterOptions();
    });
    return () => {
      active = false;
      optionsRequestId.current += 1;
    };
  }, [loadFilterOptions]);

  // Load Data for specific activeTab
  const loadTabContent = useCallback(async (page = 1) => {
    if (!companyId) return;
    const requestId = ++itemsRequestId.current;
    if (activeTab === "overview") {
      loadOverview();
      loadEmergencies();
      return;
    }
    if (activeTab === "safetyDashboard" || activeTab === "reports") {
      return;
    }
    if (activeTab === "emergencies") {
      loadEmergencies();
      return;
    }

    setLoadingItems(true);
    setItemsError("");
    setItems([]);
    setMeta({ page, totalPages: 1, total: 0 });

    try {
      let endpoint = "";
      let params = { page, limit: 15 };

      switch (activeTab) {
        case "employees":
          endpoint = "/employees";
          if (search) params.search = search;
          if (filter1) params.department = filter1;
          if (filter2) params.facility = filter2;
          if (filterStatus) params.status = filterStatus;
          break;
        case "departments":
          endpoint = "/departments";
          if (search) params.search = search;
          if (filterStatus) params.status = filterStatus;
          break;
        case "facilities":
          endpoint = "/facilities";
          if (search) params.search = search;
          if (filterStatus) params.status = filterStatus;
          break;
        case "equipment":
          endpoint = "/equipment";
          if (search) params.search = search;
          if (filter1) params.category = filter1;
          if (filter2) params.type = filter2;
          if (filterStatus) params.status = filterStatus;
          break;
        case "fireExtinguishers":
          endpoint = "/fire-extinguishers";
          if (search) params.search = search;
          if (filter1) params.extinguisherType = filter1;
          if (filterStatus) params.status = filterStatus;
          break;
        case "firstAidKits":
          endpoint = "/first-aid-kits";
          if (search) params.search = search;
          if (filterStatus) params.status = filterStatus;
          break;
        case "inspections":
          endpoint = "/inspections";
          if (search) params.search = search;
          if (filter1) params.type = filter1;
          if (filterStatus) params.status = filterStatus;
          break;
        case "correctiveActions":
          endpoint = "/corrective-actions";
          if (search) params.search = search;
          if (filter1) params.priority = filter1;
          if (filterStatus) params.status = filterStatus;
          break;
        case "emergencyResources":
          endpoint = "/emergency-resources";
          if (search) params.search = search;
          if (filter1) params.category = filter1;
          if (filter2) params.serviceType = filter2;
          if (filterStatus) params.status = filterStatus;
          break;
        case "drills":
          endpoint = "/drills";
          if (search) params.search = search;
          if (filter1) params.type = filter1;
          if (filterStatus) params.status = filterStatus;
          break;
        case "trainingPrograms":
          endpoint = "/training-programs";
          if (search) params.search = search;
          if (filterStatus) params.status = filterStatus;
          break;
        case "trainingSessions":
          endpoint = "/training-sessions";
          if (search) params.search = search;
          if (filterStatus) params.status = filterStatus;
          break;
        default:
          break;
      }

      if (endpoint) {
        const res = await api.get(endpoint, params);
        if (!Array.isArray(res.data)) {
          throw new Error(`The server returned an unexpected ${activeTab} response.`);
        }
        if (requestId === itemsRequestId.current) {
          setItems(res.data);
          setMeta(res.meta || {
            page,
            totalPages: 1,
            total: res.data.length,
          });
        }
      }
    } catch (err) {
      if (requestId === itemsRequestId.current) {
        setItems([]);
        setItemsError(err.message || `Failed to load ${activeTab} data.`);
      }
    } finally {
      if (requestId === itemsRequestId.current) {
        setLoadingItems(false);
      }
    }
  }, [
    activeTab,
    companyId,
    search,
    filter1,
    filter2,
    filterStatus,
    loadOverview,
    loadEmergencies,
  ]);

  // Reload when tab or search/filters change
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) loadTabContent(1);
    });
    return () => {
      active = false;
      itemsRequestId.current += 1;
    };
  }, [loadTabContent]);

  // Reset filters when switching tabs
  const handleTabChange = (tabId) => {
    itemsRequestId.current += 1;
    setActiveTab(tabId);
    setSearch("");
    setFilter1("");
    setFilter2("");
    setFilterStatus("");
    setDetailModalItem(null);
    setItems([]);
    setLoadingItems(false);
    setItemsError("");
    setMeta({ page: 1, totalPages: 1, total: 0 });
  };

  // Filtered emergencies
  const filteredEmergencies = emergencies.filter((e) => {
    const matchesStatus = !emergencyStatus || e.status === emergencyStatus;
    const matchesType = !emergencyType || e.type === emergencyType;
    const reporter = (e.reportedBy?.name || e.reportedBy?.email || "").toLowerCase();
    const desc = (e.description || "").toLowerCase();
    const term = emergencySearch.toLowerCase();
    const matchesSearch = !term || reporter.includes(term) || desc.includes(term);
    return matchesStatus && matchesType && matchesSearch;
  });

  const openItemDetail = (item, type) => {
    setDetailModalItem(item);
    setDetailModalType(type);
  };

  return (
    <div className="sac-dashboard">
      {/* Top Header Card */}
      <div className="sac-header-card">
        <div className="sac-header-top">
          <div className="sac-header-info">
            <div className="sac-company-avatar">
              {company?.name?.charAt(0).toUpperCase() || "C"}
            </div>
            <div>
              <div className="sac-header-title-row">
                <h2>{company?.name || "Company Dashboard"}</h2>
                <span className="sac-badge code">{company?.code || "N/A"}</span>
                <span className={`sac-badge ${company?.status || "active"}`}>
                  {company?.status || "Active"}
                </span>
                <span className="sac-badge readonly">Super Admin Read-Only</span>
              </div>
              <p className="sac-header-subtext">
                Full organization operational oversight. Live database records scoped to this company.
              </p>
            </div>
          </div>

          <div className="sac-header-actions">
            <button
              className="sac-btn secondary"
              type="button"
              onClick={() => {
                if (activeTab === "overview") {
                  loadOverview();
                  loadEmergencies();
                } else if (activeTab === "safetyDashboard") {
                  setSafetyDashboardRefreshKey((key) => key + 1);
                } else if (activeTab === "emergencies") {
                  loadEmergencies();
                } else if (activeTab === "reports") {
                  setReportsRefreshKey((key) => key + 1);
                } else {
                  loadTabContent(meta.page);
                }
              }}
            >
              ↻ Refresh
            </button>
            <button className="sac-btn primary" type="button" onClick={onBack}>
              ← Back to Companies
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <nav className="sac-tabs-bar" aria-label="Company dashboard sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`sac-tab-btn ${activeTab === tab.id ? "active" : ""}`}
            type="button"
            onClick={() => handleTabChange(tab.id)}
          >
            <span className="sac-tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Tab Content */}
      <div className={`sac-content-area${itemsError ? " has-items-error" : ""}`}>
        {optionsError && (
          <div className="sac-alert error" role="alert">
            {optionsError}
            <button className="sac-btn secondary" type="button" onClick={loadFilterOptions}>
              Try again
            </button>
          </div>
        )}
        {itemsError && (
          <div className="sac-alert error" role="alert">
            {itemsError}
            <button className="sac-btn secondary" type="button" onClick={() => loadTabContent(1)}>
              Try again
            </button>
          </div>
        )}
        {/* ================= OVERVIEW TAB ================= */}
        {activeTab === "overview" && (
          <>
            {overviewLoading ? (
              <div className="sac-loading-state" role="status">Loading company overview…</div>
            ) : overviewError ? (
              <div className="sac-alert error" role="alert">
                {overviewError}
                <button className="sac-btn secondary" type="button" onClick={loadOverview}>
                  Try again
                </button>
              </div>
            ) : overviewData ? (
            <div className="sac-stats-grid">
              <div className="sac-stat-card">
                <span className="sac-stat-label">Total Employees</span>
                <strong className="sac-stat-value">
                  {overviewData.summary.employees ?? "—"}
                </strong>
                <span className="sac-stat-sub">Registered workforce</span>
              </div>
              <div className="sac-stat-card">
                <span className="sac-stat-label">Departments</span>
                <strong className="sac-stat-value">
                  {overviewData.summary.departments ?? "—"}
                </strong>
                <span className="sac-stat-sub">Configured units</span>
              </div>
              <div className="sac-stat-card">
                <span className="sac-stat-label">Facilities</span>
                <strong className="sac-stat-value">
                  {overviewData.summary.facilities ?? "—"}
                </strong>
                <span className="sac-stat-sub">Active locations</span>
              </div>
              <div className="sac-stat-card">
                <span className="sac-stat-label">Safety Equipment</span>
                <strong className="sac-stat-value">
                  {overviewData.summary.equipment ?? "—"}
                </strong>
                <span className="sac-stat-sub">Tracked safety assets</span>
              </div>
              <div className="sac-stat-card">
                <span className="sac-stat-label">Fire Extinguishers</span>
                <strong className="sac-stat-value">
                  {overviewData.summary.fireExtinguishers ?? "—"}
                </strong>
                <span className="sac-stat-sub">Maintained units</span>
              </div>
              <div className="sac-stat-card">
                <span className="sac-stat-label">First-Aid Kits</span>
                <strong className="sac-stat-value">
                  {overviewData.summary.firstAidKits ?? "—"}
                </strong>
                <span className="sac-stat-sub">Monitored stations</span>
              </div>
              <div className="sac-stat-card">
                <span className="sac-stat-label">Inspections</span>
                <strong className="sac-stat-value">
                  {overviewData.summary.inspections ?? "—"}
                </strong>
                <span className="sac-stat-sub">Safety audits conducted</span>
              </div>
              <div className="sac-stat-card">
                <span className="sac-stat-label">Corrective Actions</span>
                <strong className="sac-stat-value">
                  {overviewData.summary.correctiveActions ?? "—"}
                </strong>
                <span className="sac-stat-sub">Remediation records</span>
              </div>
              <div className="sac-stat-card">
                <span className="sac-stat-label">Emergency Resources</span>
                <strong className="sac-stat-value">
                  {overviewData.summary.emergencyResources ?? "—"}
                </strong>
                <span className="sac-stat-sub">Ambulance, hospital, fire</span>
              </div>
              <div className="sac-stat-card">
                <span className="sac-stat-label">Emergency Drills</span>
                <strong className="sac-stat-value">
                  {overviewData.summary.drills ?? "—"}
                </strong>
                <span className="sac-stat-sub">Scheduled & conducted</span>
              </div>
              <div className="sac-stat-card">
                <span className="sac-stat-label">Training Programs</span>
                <strong className="sac-stat-value">
                  {overviewData.summary.trainingPrograms ?? "—"}
                </strong>
                <span className="sac-stat-sub">Curriculums active</span>
              </div>
              <div className="sac-stat-card">
                <span className="sac-stat-label">Emergencies</span>
                <strong className="sac-stat-value">
                  {overviewData.summary.emergencies ?? "—"}
                </strong>
                <span className="sac-stat-sub">Incident reports</span>
              </div>
            </div>
            ) : (
              <div className="sac-empty-state">
                <h4>No overview data available</h4>
                <button className="sac-btn secondary" type="button" onClick={loadOverview}>
                  Try again
                </button>
              </div>
            )}

            {/* Company Details Panel */}
            <div className="sac-panel">
              <div className="sac-panel-heading">
                <div>
                  <h3>Company Organization Record</h3>
                  <p>Core tenant entity details stored in EMSTRAP Shield.</p>
                </div>
              </div>
              <div className="sac-table-container">
                <table className="sac-table">
                  <tbody>
                    <tr>
                      <th style={{ width: "25%" }}>Company Name</th>
                      <td><strong>{company?.name}</strong></td>
                    </tr>
                    <tr>
                      <th>Company Code</th>
                      <td><code>{company?.code}</code></td>
                    </tr>
                    <tr>
                      <th>Status</th>
                      <td>
                        <span className={`sac-badge ${company?.status || "active"}`}>
                          {company?.status || "Active"}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th>Created On</th>
                      <td>{formatDate(company?.createdAt)}</td>
                    </tr>
                    <tr>
                      <th>System Identifier</th>
                      <td><code>{company?._id}</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Emergencies Snapshot */}
            <div className="sac-panel">
              <div className="sac-panel-heading">
                <div>
                  <h3>Recent Emergency Incidents</h3>
                  <p>Recent emergencies reported by company employees.</p>
                </div>
                <button
                  className="sac-action-btn"
                  type="button"
                  onClick={() => handleTabChange("emergencies")}
                >
                  View All{emergenciesLoading || emergenciesError ? "" : ` (${emergencies.length})`} →
                </button>
              </div>

              {emergenciesLoading ? (
                <div className="sac-loading-state">Loading incidents…</div>
              ) : emergenciesError ? (
                <div className="sac-empty-state" role="alert">
                  <p>{emergenciesError}</p>
                  <button className="sac-btn secondary" type="button" onClick={loadEmergencies}>
                    Try again
                  </button>
                </div>
              ) : emergencies.length === 0 ? (
                <div className="sac-empty-state">
                  <h4>No emergencies recorded</h4>
                  <p>No emergency incidents have been logged for this company.</p>
                </div>
              ) : (
                <div className="sac-table-container">
                  <table className="sac-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Reported Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emergencies.slice(0, 5).map((emg) => (
                        <tr key={emg._id || emg.id}>
                          <td>
                            <strong>
                              {emg.reportedBy?.name || emg.reportedBy?.email || "Unknown"}
                            </strong>
                          </td>
                          <td>{formatStatus(emg.type)}</td>
                          <td>
                            <span className={`sac-badge ${emg.status}`}>
                              {formatStatus(emg.status)}
                            </span>
                          </td>
                          <td>{formatDate(emg.createdAt)}</td>
                          <td>
                            <button
                              className="sac-action-btn"
                              onClick={() => setSelectedEmergency(emg)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ================= SAFETY DASHBOARD TAB ================= */}
        {activeTab === "safetyDashboard" && (
          <div className="sac-panel">
            <Dashboard
              key={companyId}
              refreshKey={safetyDashboardRefreshKey}
            />
          </div>
        )}

        {/* ================= EMERGENCIES TAB ================= */}
        {activeTab === "emergencies" && (
          <div className="sac-panel">
            <div className="sac-panel-heading">
              <div>
                <h3>Emergency Monitoring & Incident Records</h3>
                <p>Real-time emergency incidents reported by employees for {company?.name}.</p>
              </div>
              <span className="sac-stat-sub">
                {emergenciesLoading
                  ? "Loading emergency records…"
                  : emergenciesError
                  ? "Emergency records unavailable"
                  : `Showing ${filteredEmergencies.length} of ${emergencies.length} records`}
              </span>
            </div>

            <div className="sac-filters-row">
              <input
                className="sac-input"
                placeholder="Search employee, type, or description…"
                value={emergencySearch}
                onChange={(e) => setEmergencySearch(e.target.value)}
              />
              <select
                className="sac-select"
                value={emergencyStatus}
                onChange={(e) => setEmergencyStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="triggered">Triggered</option>
                <option value="alert_created">Alert Created</option>
                <option value="response_in_progress">Response In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                className="sac-select"
                value={emergencyType}
                onChange={(e) => setEmergencyType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="medical">Medical</option>
                <option value="fire">Fire</option>
                <option value="accident">Accident</option>
                <option value="electrical">Electrical</option>
                <option value="chemical">Chemical</option>
                <option value="gas">Gas</option>
                <option value="vehicle">Vehicle</option>
                <option value="equipment">Equipment</option>
                <option value="security">Security</option>
                <option value="other">Other</option>
              </select>
              {(emergencySearch || emergencyStatus || emergencyType) && (
                <button
                  className="sac-btn secondary"
                  onClick={() => {
                    setEmergencySearch("");
                    setEmergencyStatus("");
                    setEmergencyType("");
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {emergenciesLoading ? (
              <div className="sac-loading-state">Loading emergency reports…</div>
            ) : emergenciesError ? (
              <div className="sac-empty-state" role="alert">
                <p>{emergenciesError}</p>
                <button className="sac-btn secondary" type="button" onClick={loadEmergencies}>
                  Try again
                </button>
              </div>
            ) : filteredEmergencies.length === 0 ? (
              <div className="sac-empty-state">
                <h4>No emergencies found</h4>
                <p>Try adjusting your search criteria or status filter.</p>
              </div>
            ) : (
              <div className="sac-table-container">
                <table className="sac-table">
                  <thead>
                    <tr>
                      <th>Reported By</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Location</th>
                      <th>Reported At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmergencies.map((emg) => (
                      <tr key={emg._id || emg.id}>
                        <td>
                          <strong>
                            {emg.reportedBy?.name || emg.reportedBy?.email || "Unknown"}
                          </strong>
                        </td>
                        <td>{formatStatus(emg.type)}</td>
                        <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {emg.description || "—"}
                        </td>
                        <td>
                          <span className={`sac-badge ${emg.status}`}>
                            {formatStatus(emg.status)}
                          </span>
                        </td>
                        <td>
                          {emg.location?.address ||
                            (emg.location?.latitude != null && emg.location?.longitude != null
                              ? `${emg.location.latitude}, ${emg.location.longitude}`
                              : "—")}
                        </td>
                        <td>{formatDate(emg.createdAt)}</td>
                        <td>
                          <button
                            className="sac-action-btn"
                            onClick={() => setSelectedEmergency(emg)}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= EMPLOYEES TAB ================= */}
        {activeTab === "employees" && (
          <div className="sac-panel">
            <div className="sac-panel-heading">
              <div>
                <h3>Employee Management</h3>
                <p>All personnel assigned to {company?.name}.</p>
              </div>
              <span className="sac-stat-sub">{meta.total} total employees</span>
            </div>

            <div className="sac-filters-row">
              <input
                className="sac-input"
                placeholder="Search by name, email, employee ID, designation…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="sac-select" value={filter1} onChange={(e) => setFilter1(e.target.value)}>
                <option value="">All Departments</option>
                {departmentOptions.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
              <select className="sac-select" value={filter2} onChange={(e) => setFilter2(e.target.value)}>
                <option value="">All Facilities</option>
                {facilityOptions.map((f) => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
              <select className="sac-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {loadingItems ? (
              <div className="sac-loading-state">Loading employees…</div>
            ) : items.length === 0 ? (
              <div className="sac-empty-state">
                <h4>No employees found</h4>
                <p>No employee records matched the selected criteria.</p>
              </div>
            ) : (
              <>
                <div className="sac-table-container">
                  <table className="sac-table">
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Name / Email</th>
                        <th>Department</th>
                        <th>Facility</th>
                        <th>Designation</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((emp) => (
                        <tr key={emp._id}>
                          <td><code>{emp.employeeId || "—"}</code></td>
                          <td>
                            <strong>{emp.name}</strong>
                            <div style={{ fontSize: 11, color: "#64748b" }}>{emp.email}</div>
                          </td>
                          <td>{emp.department?.name || "—"}</td>
                          <td>{emp.facility?.name || "—"}</td>
                          <td>{emp.designation || "—"}</td>
                          <td>
                            <span className={`sac-badge ${emp.status}`}>
                              {formatStatus(emp.status)}
                            </span>
                          </td>
                          <td>
                            <button
                              className="sac-action-btn"
                              onClick={() => openItemDetail(emp, "employee")}
                            >
                              View Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="sac-pagination">
                  <span>Page {meta.page} of {meta.totalPages} ({meta.total} records)</span>
                  <div className="sac-pagination-buttons">
                    <button
                      disabled={meta.page <= 1}
                      onClick={() => loadTabContent(meta.page - 1)}
                    >
                      Previous
                    </button>
                    <button
                      disabled={meta.page >= meta.totalPages}
                      onClick={() => loadTabContent(meta.page + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= DEPARTMENTS TAB ================= */}
        {activeTab === "departments" && (
          <div className="sac-panel">
            <div className="sac-panel-heading">
              <div>
                <h3>Department Management</h3>
                <p>Operational departments registered for {company?.name}.</p>
              </div>
              <span className="sac-stat-sub">{meta.total} departments</span>
            </div>

            <div className="sac-filters-row">
              <input
                className="sac-input"
                placeholder="Search department name or code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="sac-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {loadingItems ? (
              <div className="sac-loading-state">Loading departments…</div>
            ) : items.length === 0 ? (
              <div className="sac-empty-state">
                <h4>No departments found</h4>
                <p>No departments configured for this company.</p>
              </div>
            ) : (
              <div className="sac-table-container">
                <table className="sac-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Facility</th>
                      <th>Manager</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((dept) => (
                      <tr key={dept._id}>
                        <td><strong>{dept.name}</strong></td>
                        <td>{dept.facility?.name || "—"}</td>
                        <td>{dept.manager?.name || "—"}</td>
                        <td>
                          <span className={`sac-badge ${dept.status}`}>
                            {formatStatus(dept.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="sac-action-btn"
                            onClick={() => openItemDetail(dept, "department")}
                          >
                            View Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= FACILITIES TAB ================= */}
        {activeTab === "facilities" && (
          <div className="sac-panel">
            <div className="sac-panel-heading">
              <div>
                <h3>Facility Management</h3>
                <p>Physical plant locations, buildings, and sites.</p>
              </div>
              <span className="sac-stat-sub">{meta.total} facilities</span>
            </div>

            <div className="sac-filters-row">
              <input
                className="sac-input"
                placeholder="Search facility name, code, or city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="sac-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {loadingItems ? (
              <div className="sac-loading-state">Loading facilities…</div>
            ) : items.length === 0 ? (
              <div className="sac-empty-state">
                <h4>No facilities found</h4>
                <p>No facility records registered for this company.</p>
              </div>
            ) : (
              <div className="sac-table-container">
                <table className="sac-table">
                  <thead>
                    <tr>
                      <th>Facility Name</th>
                      <th>Address</th>
                      <th>City / State</th>
                      <th>Emergency Contact</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((fac) => (
                      <tr key={fac._id}>
                        <td><strong>{fac.name}</strong></td>
                        <td>{fac.address || "—"}</td>
                        <td>{[fac.city, fac.state].filter(Boolean).join(", ") || "—"}</td>
                        <td>{fac.emergencyContact?.name ? `${fac.emergencyContact.name} (${fac.emergencyContact.phone || "No phone"})` : "—"}</td>
                        <td>
                          <span className={`sac-badge ${fac.status}`}>
                            {formatStatus(fac.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="sac-action-btn"
                            onClick={() => openItemDetail(fac, "facility")}
                          >
                            View Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= SAFETY EQUIPMENT TAB ================= */}
        {activeTab === "equipment" && (
          <div className="sac-panel">
            <div className="sac-panel-heading">
              <div>
                <h3>Safety Equipment & Assets</h3>
                <p>Tracked safety apparatus, PPE, and workplace safety systems.</p>
              </div>
              <span className="sac-stat-sub">{meta.total} items</span>
            </div>

            <div className="sac-filters-row">
              <input
                className="sac-input"
                placeholder="Search equipment name, serial number…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="sac-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="operational">Operational</option>
                <option value="maintenance_required">Maintenance Required</option>
                <option value="out_of_service">Out of Service</option>
                <option value="decommissioned">Decommissioned</option>
              </select>
            </div>

            {loadingItems ? (
              <div className="sac-loading-state">Loading equipment…</div>
            ) : items.length === 0 ? (
              <div className="sac-empty-state">
                <h4>No equipment records found</h4>
                <p>No safety equipment recorded for this company.</p>
              </div>
            ) : (
              <div className="sac-table-container">
                <table className="sac-table">
                  <thead>
                    <tr>
                      <th>Equipment Name</th>
                      <th>Type</th>
                      <th>Facility</th>
                      <th>Location</th>
                      <th>Last Inspection</th>
                      <th>Next Inspection</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((eq) => (
                      <tr key={eq._id}>
                        <td><strong>{eq.name}</strong></td>
                        <td>{formatStatus(eq.type)}</td>
                        <td>{eq.facility?.name || "—"}</td>
                        <td>{eq.location || "—"}</td>
                        <td>{formatDate(eq.lastInspectionDate)}</td>
                        <td>{formatDate(eq.nextInspectionDate)}</td>
                        <td>
                          <span className={`sac-badge ${eq.status}`}>
                            {formatStatus(eq.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="sac-action-btn"
                            onClick={() => openItemDetail(eq, "equipment")}
                          >
                            View Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= FIRE EXTINGUISHERS TAB ================= */}
        {activeTab === "fireExtinguishers" && (
          <div className="sac-panel">
            <div className="sac-panel-heading">
              <div>
                <h3>Fire Extinguisher Inventory & Maintenance</h3>
                <p>Inspected fire extinguisher inventory and pressure certifications.</p>
              </div>
              <span className="sac-stat-sub">{meta.total} extinguishers</span>
            </div>

            <div className="sac-filters-row">
              <input
                className="sac-input"
                placeholder="Search extinguisher tag or location…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="sac-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="operational">Operational</option>
                <option value="maintenance_required">Maintenance Due</option>
                <option value="out_of_service">Out of Service</option>
              </select>
            </div>

            {loadingItems ? (
              <div className="sac-loading-state">Loading fire extinguishers…</div>
            ) : items.length === 0 ? (
              <div className="sac-empty-state">
                <h4>No fire extinguishers found</h4>
                <p>No fire extinguishers registered for this company.</p>
              </div>
            ) : (
              <div className="sac-table-container">
                <table className="sac-table">
                  <thead>
                    <tr>
                      <th>Unit Name / Tag</th>
                      <th>Facility</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((fe) => (
                      <tr key={fe._id}>
                        <td><strong>{fe.name}</strong></td>
                        <td>{fe.facility?.name || "—"}</td>
                        <td>{fe.extinguisherType || fe.type || "—"}</td>
                        <td>{fe.location || "—"}</td>
                        <td>{formatDate(fe.expiryDate)}</td>
                        <td>
                          <span className={`sac-badge ${fe.status}`}>
                            {formatStatus(fe.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="sac-action-btn"
                            onClick={() => openItemDetail(fe, "fireExtinguisher")}
                          >
                            View Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= FIRST-AID KITS TAB ================= */}
        {activeTab === "firstAidKits" && (
          <div className="sac-panel">
            <div className="sac-panel-heading">
              <div>
                <h3>First-Aid Kit Monitoring</h3>
                <p>Stock verification, refill status, and medical supply inventory.</p>
              </div>
              <span className="sac-stat-sub">{meta.total} kits</span>
            </div>

            <div className="sac-filters-row">
              <input
                className="sac-input"
                placeholder="Search first aid kit by name or location…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="sac-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="operational">Operational</option>
                <option value="maintenance_required">Refill Required</option>
                <option value="out_of_service">Out of Service</option>
              </select>
            </div>

            {loadingItems ? (
              <div className="sac-loading-state">Loading first-aid kits…</div>
            ) : items.length === 0 ? (
              <div className="sac-empty-state">
                <h4>No first-aid kits found</h4>
                <p>No first-aid kits recorded for this company.</p>
              </div>
            ) : (
              <div className="sac-table-container">
                <table className="sac-table">
                  <thead>
                    <tr>
                      <th>Kit Name</th>
                      <th>Facility</th>
                      <th>Location</th>
                      <th>Contents Status</th>
                      <th>Next Inspection</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((fak) => (
                      <tr key={fak._id}>
                        <td><strong>{fak.name}</strong></td>
                        <td>{fak.facility?.name || "—"}</td>
                        <td>{fak.location || "—"}</td>
                        <td>{fak.firstAidKit?.contentsStatus || "Complete"}</td>
                        <td>{formatDate(fak.nextInspectionDate)}</td>
                        <td>
                          <span className={`sac-badge ${fak.status}`}>
                            {formatStatus(fak.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="sac-action-btn"
                            onClick={() => openItemDetail(fak, "firstAidKit")}
                          >
                            View Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= INSPECTIONS TAB ================= */}
        {activeTab === "inspections" && (
          <div className="sac-panel">
            <div className="sac-panel-heading">
              <div>
                <h3>Safety Inspections & Audits</h3>
                <p>Facility walkthroughs, hazard assessments, and checklist results.</p>
              </div>
              <span className="sac-stat-sub">{meta.total} inspections</span>
            </div>

            <div className="sac-filters-row">
              <input
                className="sac-input"
                placeholder="Search inspection records…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="sac-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Results</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="needs_attention">Needs Attention</option>
              </select>
            </div>

            {loadingItems ? (
              <div className="sac-loading-state">Loading inspections…</div>
            ) : items.length === 0 ? (
              <div className="sac-empty-state">
                <h4>No inspections recorded</h4>
                <p>No safety inspections logged for this company.</p>
              </div>
            ) : (
              <div className="sac-table-container">
                <table className="sac-table">
                  <thead>
                    <tr>
                      <th>Title / Type</th>
                      <th>Facility</th>
                      <th>Inspector</th>
                      <th>Inspection Date</th>
                      <th>Result</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((insp) => (
                      <tr key={insp._id}>
                        <td>
                          <strong>{insp.title || insp.inspectionType || "Safety Inspection"}</strong>
                        </td>
                        <td>{insp.facility?.name || "—"}</td>
                        <td>{insp.inspector?.name || "—"}</td>
                        <td>{formatDate(insp.inspectionDate || insp.createdAt)}</td>
                        <td>
                          <span className={`sac-badge ${insp.result === "passed" ? "active" : "inactive"}`}>
                            {formatStatus(insp.result || "Completed")}
                          </span>
                        </td>
                        <td>
                          <button
                            className="sac-action-btn"
                            onClick={() => openItemDetail(insp, "inspection")}
                          >
                            View Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= CORRECTIVE ACTIONS TAB ================= */}
        {activeTab === "correctiveActions" && (
          <div className="sac-panel">
            <div className="sac-panel-heading">
              <div>
                <h3>Corrective Actions & Remediation</h3>
                <p>Mitigation tasks generated from audits, drills, and incidents.</p>
              </div>
              <span className="sac-stat-sub">{meta.total} actions</span>
            </div>

            <div className="sac-filters-row">
              <input
                className="sac-input"
                placeholder="Search corrective actions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="sac-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="verified">Verified</option>
              </select>
            </div>

            {loadingItems ? (
              <div className="sac-loading-state">Loading corrective actions…</div>
            ) : items.length === 0 ? (
              <div className="sac-empty-state">
                <h4>No corrective actions</h4>
                <p>No open or recorded corrective actions for this company.</p>
              </div>
            ) : (
              <div className="sac-table-container">
                <table className="sac-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Priority</th>
                      <th>Assigned To</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((ca) => (
                      <tr key={ca._id}>
                        <td><strong>{ca.title}</strong></td>
                        <td>
                          <span className={`sac-badge ${ca.priority === "high" ? "inactive" : "code"}`}>
                            {formatStatus(ca.priority)}
                          </span>
                        </td>
                        <td>{ca.assignedTo?.name || "—"}</td>
                        <td>{formatDate(ca.dueDate)}</td>
                        <td>
                          <span className={`sac-badge ${ca.status === "completed" || ca.status === "verified" ? "active" : "code"}`}>
                            {formatStatus(ca.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="sac-action-btn"
                            onClick={() => openItemDetail(ca, "correctiveAction")}
                          >
                            View Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= EMERGENCY RESOURCES TAB ================= */}
        {activeTab === "emergencyResources" && (
          <div className="sac-panel">
            <div className="sac-panel-heading">
              <div>
                <h3>Emergency Resources & Coordination</h3>
                <p>
                  Internal teams and external response coordination: Ambulance providers, hospitals, fire departments.
                </p>
              </div>
              <span className="sac-stat-sub">{meta.total} resources</span>
            </div>

            <div className="sac-filters-row">
              <input
                className="sac-input"
                placeholder="Search emergency resources, providers, contacts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="sac-select" value={filter1} onChange={(e) => setFilter1(e.target.value)}>
                <option value="">All Categories</option>
                <option value="internal">Internal Teams</option>
                <option value="external">External Providers</option>
              </select>
              <select className="sac-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {loadingItems ? (
              <div className="sac-loading-state">Loading emergency resources…</div>
            ) : items.length === 0 ? (
              <div className="sac-empty-state">
                <h4>No emergency resources configured</h4>
                <p>No internal responders or external service partners listed for this company.</p>
              </div>
            ) : (
              <div className="sac-table-container">
                <table className="sac-table">
                  <thead>
                    <tr>
                      <th>Resource / Provider</th>
                      <th>Category</th>
                      <th>Service Type</th>
                      <th>Contact Person</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((resItem) => (
                      <tr key={resItem._id}>
                        <td><strong>{resItem.name}</strong></td>
                        <td>
                          <span className={`sac-badge ${resItem.category === "external" ? "code" : "active"}`}>
                            {formatStatus(resItem.category)}
                          </span>
                        </td>
                        <td>{formatStatus(resItem.serviceType)}</td>
                        <td>{resItem.contact?.contactPerson || "—"}</td>
                        <td>{resItem.contact?.phone || "—"}</td>
                        <td>
                          <span className={`sac-badge ${resItem.status}`}>
                            {formatStatus(resItem.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="sac-action-btn"
                            onClick={() => openItemDetail(resItem, "emergencyResource")}
                          >
                            View Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= DRILLS TAB ================= */}
        {activeTab === "drills" && (
          <div className="sac-panel">
            <div className="sac-panel-heading">
              <div>
                <h3>Emergency Drills & Preparedness Exercises</h3>
                <p>Fire drills, evacuation trials, active threat training simulations.</p>
              </div>
              <span className="sac-stat-sub">{meta.total} drills</span>
            </div>

            <div className="sac-filters-row">
              <input
                className="sac-input"
                placeholder="Search drills…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="sac-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {loadingItems ? (
              <div className="sac-loading-state">Loading drills…</div>
            ) : items.length === 0 ? (
              <div className="sac-empty-state">
                <h4>No emergency drills recorded</h4>
                <p>No drills logged for this company.</p>
              </div>
            ) : (
              <div className="sac-table-container">
                <table className="sac-table">
                  <thead>
                    <tr>
                      <th>Drill Name</th>
                      <th>Type</th>
                      <th>Facility</th>
                      <th>Scheduled Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((dr) => (
                      <tr key={dr._id}>
                        <td><strong>{dr.name || dr.title}</strong></td>
                        <td>{formatStatus(dr.type || dr.drillType)}</td>
                        <td>{dr.facility?.name || "—"}</td>
                        <td>{formatDate(dr.scheduledDate)}</td>
                        <td>
                          <span className={`sac-badge ${dr.status === "completed" ? "active" : "code"}`}>
                            {formatStatus(dr.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="sac-action-btn"
                            onClick={() => openItemDetail(dr, "drill")}
                          >
                            View Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= TRAINING PROGRAMS TAB ================= */}
        {activeTab === "trainingPrograms" && (
          <div className="sac-panel">
            <div className="sac-panel-heading">
              <div>
                <h3>Training Programs & Compliance Courses</h3>
                <p>Mandatory safety courses, certifications, and workplace curricula.</p>
              </div>
              <span className="sac-stat-sub">{meta.total} programs</span>
            </div>

            <div className="sac-filters-row">
              <input
                className="sac-input"
                placeholder="Search training program name or code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="sac-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {loadingItems ? (
              <div className="sac-loading-state">Loading training programs…</div>
            ) : items.length === 0 ? (
              <div className="sac-empty-state">
                <h4>No training programs recorded</h4>
                <p>No safety training programs configured for this company.</p>
              </div>
            ) : (
              <div className="sac-table-container">
                <table className="sac-table">
                  <thead>
                    <tr>
                      <th>Program Name</th>
                      <th>Type</th>
                      <th>Duration (Hours)</th>
                      <th>Frequency</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((tp) => (
                      <tr key={tp._id}>
                        <td><strong>{tp.name}</strong></td>
                        <td>{formatStatus(tp.type)}</td>
                        <td>{tp.durationHours ? `${tp.durationHours} hrs` : "—"}</td>
                        <td>{tp.frequencyMonths ? `Every ${tp.frequencyMonths} mos` : "One-time"}</td>
                        <td>
                          <span className={`sac-badge ${tp.status}`}>
                            {formatStatus(tp.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="sac-action-btn"
                            onClick={() => openItemDetail(tp, "trainingProgram")}
                          >
                            View Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= TRAINING SESSIONS TAB ================= */}
        {activeTab === "trainingSessions" && (
          <div className="sac-panel">
            <div className="sac-panel-heading">
              <div>
                <h3>Training Sessions & Attendance Records</h3>
                <p>Classroom, virtual, and field safety instruction sessions.</p>
              </div>
              <span className="sac-stat-sub">{meta.total} sessions</span>
            </div>

            <div className="sac-filters-row">
              <input
                className="sac-input"
                placeholder="Search sessions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="sac-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {loadingItems ? (
              <div className="sac-loading-state">Loading training sessions…</div>
            ) : items.length === 0 ? (
              <div className="sac-empty-state">
                <h4>No training sessions recorded</h4>
                <p>No training sessions scheduled for this company.</p>
              </div>
            ) : (
              <div className="sac-table-container">
                <table className="sac-table">
                  <thead>
                    <tr>
                      <th>Program</th>
                      <th>Scheduled Date</th>
                      <th>Trainer</th>
                      <th>Facility</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((ts) => (
                      <tr key={ts._id}>
                        <td><strong>{ts.program?.name || "Training Session"}</strong></td>
                        <td>{formatDate(ts.scheduledDate)}</td>
                        <td>{ts.trainer || "—"}</td>
                        <td>{ts.facility?.name || "—"}</td>
                        <td>
                          <span className={`sac-badge ${ts.status === "completed" ? "active" : "code"}`}>
                            {formatStatus(ts.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="sac-action-btn"
                            onClick={() => openItemDetail(ts, "trainingSession")}
                          >
                            View Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= REPORTS TAB ================= */}
        {activeTab === "reports" && (
          <div className="sac-panel">
            <Reports key={reportsRefreshKey} />
          </div>
        )}
      </div>

      {/* ================= EMERGENCY DETAILS MODAL ================= */}
      {selectedEmergency && (
        <div className="sac-modal-overlay" onClick={() => setSelectedEmergency(null)}>
          <div className="sac-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sac-modal-header">
              <div>
                <h3>Emergency Incident Details</h3>
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  Reference: <code>{selectedEmergency._id || selectedEmergency.id}</code>
                </span>
              </div>
              <button
                className="sac-modal-close-btn"
                onClick={() => setSelectedEmergency(null)}
              >
                ✕
              </button>
            </div>

            <div className="sac-modal-body">
              <div className="sac-detail-grid">
                <div className="sac-detail-item">
                  <span>Reported By</span>
                  <strong>{selectedEmergency.reportedBy?.name || selectedEmergency.reportedBy?.email || "Unknown"}</strong>
                </div>
                <div className="sac-detail-item">
                  <span>Emergency Type</span>
                  <strong>{formatStatus(selectedEmergency.type)}</strong>
                </div>
                <div className="sac-detail-item">
                  <span>Status</span>
                  <span className={`sac-badge ${selectedEmergency.status}`} style={{ width: "fit-content" }}>
                    {formatStatus(selectedEmergency.status)}
                  </span>
                </div>
                <div className="sac-detail-item">
                  <span>Reported At</span>
                  <strong>{formatDate(selectedEmergency.createdAt)}</strong>
                </div>
                <div className="sac-detail-item">
                  <span>Last Updated</span>
                  <strong>{formatDate(selectedEmergency.updatedAt)}</strong>
                </div>
                <div className="sac-detail-item">
                  <span>Resolved At</span>
                  <strong>{formatDate(selectedEmergency.resolvedAt)}</strong>
                </div>
                <div className="sac-detail-item full-width">
                  <span>Description</span>
                  <p>{selectedEmergency.description || "No description provided."}</p>
                </div>
                <div className="sac-detail-item full-width">
                  <span>Location</span>
                  <p>{selectedEmergency.location?.address || "Address not provided"}</p>
                  {selectedEmergency.location?.latitude != null && (
                    <small style={{ color: "#64748b" }}>
                      Latitude: {selectedEmergency.location.latitude} | Longitude: {selectedEmergency.location.longitude}
                    </small>
                  )}
                </div>
                {selectedEmergency.cancellationReason && (
                  <div className="sac-detail-item full-width">
                    <span>Cancellation Reason</span>
                    <p>{selectedEmergency.cancellationReason}</p>
                  </div>
                )}
              </div>

              {/* Response Timeline */}
              <div>
                <h4 style={{ margin: "0 0 12px", fontSize: 14 }}>Response History</h4>
                {!selectedEmergency.responseHistory?.length ? (
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>No response events logged.</p>
                ) : (
                  <div className="sac-timeline">
                    {selectedEmergency.responseHistory.map((item, idx) => (
                      <div className="sac-timeline-item" key={idx}>
                        <strong>{formatStatus(item.action)}</strong>
                        <span className="sac-timeline-time">{formatDate(item.timestamp)}</span>
                        {item.note && <p style={{ margin: "2px 0 0", fontSize: 12 }}>{item.note}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Evidence Photos/Videos */}
              <div>
                <h4 style={{ margin: "0 0 12px", fontSize: 14 }}>
                  Uploaded Evidence ({selectedEmergency.evidence?.length || 0})
                </h4>
                {!selectedEmergency.evidence?.length ? (
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>No media files attached.</p>
                ) : (
                  <div className="sac-evidence-grid">
                    {selectedEmergency.evidence.map((item, index) => (
                      <div className="sac-evidence-thumb" key={index}>
                        {item.mediaType === "video" ? (
                          <video src={item.url} controls />
                        ) : (
                          <img src={item.url} alt={`Evidence ${index + 1}`} />
                        )}
                        <a href={item.url} target="_blank" rel="noreferrer">
                          Open full size
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="sac-modal-footer">
              <button
                className="sac-btn secondary"
                onClick={() => setSelectedEmergency(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= GENERIC MODULE DETAIL MODAL ================= */}
      {detailModalItem && (
        <div className="sac-modal-overlay" onClick={() => setDetailModalItem(null)}>
          <div className="sac-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sac-modal-header">
              <div>
                <h3>{formatStatus(detailModalType)} Details</h3>
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  Record ID: <code>{detailModalItem._id}</code>
                </span>
              </div>
              <button className="sac-modal-close-btn" onClick={() => setDetailModalItem(null)}>
                ✕
              </button>
            </div>

            <div className="sac-modal-body">
              <div className="sac-detail-grid">
                {/* Employee Details */}
                {detailModalType === "employee" && (
                  <>
                    <div className="sac-detail-item">
                      <span>Full Name</span>
                      <strong>{detailModalItem.name}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Employee ID</span>
                      <strong>{detailModalItem.employeeId || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Email</span>
                      <strong>{detailModalItem.email || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Phone</span>
                      <strong>{detailModalItem.phone || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Department</span>
                      <strong>{detailModalItem.department?.name || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Facility</span>
                      <strong>{detailModalItem.facility?.name || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Designation</span>
                      <strong>{detailModalItem.designation || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Status</span>
                      <span className={`sac-badge ${detailModalItem.status}`}>
                        {formatStatus(detailModalItem.status)}
                      </span>
                    </div>
                    <div className="sac-detail-item">
                      <span>Joining Date</span>
                      <strong>{formatDate(detailModalItem.joiningDate)}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Emergency Contact</span>
                      <strong>
                        {detailModalItem.emergencyContact?.name
                          ? `${detailModalItem.emergencyContact.name} (${detailModalItem.emergencyContact.phone || "No phone"}) - ${detailModalItem.emergencyContact.relationship || "Contact"}`
                          : "—"}
                      </strong>
                    </div>
                  </>
                )}

                {/* Department Details */}
                {detailModalType === "department" && (
                  <>
                    <div className="sac-detail-item">
                      <span>Department Name</span>
                      <strong>{detailModalItem.name}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Department Code</span>
                      <strong>{detailModalItem.code || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Facility</span>
                      <strong>{detailModalItem.facility?.name || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Manager</span>
                      <strong>{detailModalItem.manager?.name || "—"}</strong>
                    </div>
                    <div className="sac-detail-item full-width">
                      <span>Description</span>
                      <p>{detailModalItem.description || "No description provided."}</p>
                    </div>
                  </>
                )}

                {/* Facility Details */}
                {detailModalType === "facility" && (
                  <>
                    <div className="sac-detail-item">
                      <span>Facility Name</span>
                      <strong>{detailModalItem.name}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Facility Code</span>
                      <strong>{detailModalItem.code || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Address</span>
                      <p>{detailModalItem.address || "—"}</p>
                    </div>
                    <div className="sac-detail-item">
                      <span>City / State</span>
                      <strong>{[detailModalItem.city, detailModalItem.state].filter(Boolean).join(", ") || "—"}</strong>
                    </div>
                    <div className="sac-detail-item full-width">
                      <span>Emergency Contact</span>
                      <strong>
                        {detailModalItem.emergencyContact?.name
                          ? `${detailModalItem.emergencyContact.name} (${detailModalItem.emergencyContact.phone || "No phone"})`
                          : "—"}
                      </strong>
                    </div>
                  </>
                )}

                {/* Safety Equipment Details */}
                {detailModalType === "equipment" && (
                  <>
                    <div className="sac-detail-item">
                      <span>Equipment Name</span>
                      <strong>{detailModalItem.name}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Category</span>
                      <strong>{formatStatus(detailModalItem.category)}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Type</span>
                      <strong>{formatStatus(detailModalItem.type)}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Serial Number</span>
                      <strong>{detailModalItem.serialNumber || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Facility</span>
                      <strong>{detailModalItem.facility?.name || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Location</span>
                      <strong>{detailModalItem.location || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Manufacturer</span>
                      <strong>{detailModalItem.manufacturer || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Model</span>
                      <strong>{detailModalItem.model || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Last Inspection</span>
                      <strong>{formatDate(detailModalItem.lastInspectionDate)}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Next Inspection</span>
                      <strong>{formatDate(detailModalItem.nextInspectionDate)}</strong>
                    </div>
                  </>
                )}

                {/* Fire Extinguisher Details */}
                {detailModalType === "fireExtinguisher" && (
                  <>
                    <div className="sac-detail-item">
                      <span>Tag / Name</span>
                      <strong>{detailModalItem.name}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Extinguisher Type</span>
                      <strong>{detailModalItem.extinguisherType || detailModalItem.type || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Facility</span>
                      <strong>{detailModalItem.facility?.name || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Location</span>
                      <strong>{detailModalItem.location || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Weight / Capacity</span>
                      <strong>{detailModalItem.capacity || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Service Date</span>
                      <strong>{formatDate(detailModalItem.serviceDate)}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Expiry Date</span>
                      <strong>{formatDate(detailModalItem.expiryDate)}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Next Inspection Date</span>
                      <strong>{formatDate(detailModalItem.nextInspectionDate)}</strong>
                    </div>
                  </>
                )}

                {/* First-Aid Kit Details */}
                {detailModalType === "firstAidKit" && (
                  <>
                    <div className="sac-detail-item">
                      <span>Kit Name</span>
                      <strong>{detailModalItem.name}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Facility</span>
                      <strong>{detailModalItem.facility?.name || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Location</span>
                      <strong>{detailModalItem.location || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Contents Status</span>
                      <strong>{detailModalItem.firstAidKit?.contentsStatus || "Complete"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Refill Required</span>
                      <strong>{detailModalItem.firstAidKit?.refillRequired ? "Yes" : "No"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Last Stock Check</span>
                      <strong>{formatDate(detailModalItem.lastInspectionDate)}</strong>
                    </div>
                  </>
                )}

                {/* Safety Inspection Details */}
                {detailModalType === "inspection" && (
                  <>
                    <div className="sac-detail-item">
                      <span>Title</span>
                      <strong>{detailModalItem.title || "Safety Inspection"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Inspection Type</span>
                      <strong>{formatStatus(detailModalItem.inspectionType || detailModalItem.type)}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Facility</span>
                      <strong>{detailModalItem.facility?.name || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Inspector</span>
                      <strong>{detailModalItem.inspector?.name || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Inspection Date</span>
                      <strong>{formatDate(detailModalItem.inspectionDate || detailModalItem.createdAt)}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Result</span>
                      <span className={`sac-badge ${detailModalItem.result === "passed" ? "active" : "inactive"}`}>
                        {formatStatus(detailModalItem.result || "Passed")}
                      </span>
                    </div>
                    <div className="sac-detail-item full-width">
                      <span>Findings / Notes</span>
                      <p>{detailModalItem.notes || detailModalItem.findings || "No notes recorded."}</p>
                    </div>
                  </>
                )}

                {/* Corrective Action Details */}
                {detailModalType === "correctiveAction" && (
                  <>
                    <div className="sac-detail-item full-width">
                      <span>Title</span>
                      <strong>{detailModalItem.title}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Priority</span>
                      <span className={`sac-badge ${detailModalItem.priority === "high" ? "inactive" : "code"}`}>
                        {formatStatus(detailModalItem.priority)}
                      </span>
                    </div>
                    <div className="sac-detail-item">
                      <span>Status</span>
                      <span className={`sac-badge ${detailModalItem.status === "completed" || detailModalItem.status === "verified" ? "active" : "code"}`}>
                        {formatStatus(detailModalItem.status)}
                      </span>
                    </div>
                    <div className="sac-detail-item">
                      <span>Assigned To</span>
                      <strong>{detailModalItem.assignedTo?.name || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Due Date</span>
                      <strong>{formatDate(detailModalItem.dueDate)}</strong>
                    </div>
                    <div className="sac-detail-item full-width">
                      <span>Description</span>
                      <p>{detailModalItem.description || "No description provided."}</p>
                    </div>
                    {detailModalItem.resolutionNotes && (
                      <div className="sac-detail-item full-width">
                        <span>Resolution Notes</span>
                        <p>{detailModalItem.resolutionNotes}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Emergency Resource Details */}
                {detailModalType === "emergencyResource" && (
                  <>
                    <div className="sac-detail-item">
                      <span>Provider / Resource</span>
                      <strong>{detailModalItem.name}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Category</span>
                      <strong>{formatStatus(detailModalItem.category)}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Service Type</span>
                      <strong>{formatStatus(detailModalItem.serviceType)}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Contact Person</span>
                      <strong>{detailModalItem.contact?.contactPerson || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Phone</span>
                      <strong>{detailModalItem.contact?.phone || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Email</span>
                      <strong>{detailModalItem.contact?.email || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Location</span>
                      <p>{detailModalItem.location || "—"}</p>
                    </div>
                    <div className="sac-detail-item">
                      <span>Coverage Area</span>
                      <p>{detailModalItem.coverageArea || "—"}</p>
                    </div>
                    <div className="sac-detail-item">
                      <span>Availability</span>
                      <strong>{detailModalItem.availability || "24x7"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Integration Status</span>
                      <strong>{formatStatus(detailModalItem.integrationStatus || "not_integrated")}</strong>
                    </div>
                    {detailModalItem.notes && (
                      <div className="sac-detail-item full-width">
                        <span>Notes</span>
                        <p>{detailModalItem.notes}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Emergency Drill Details */}
                {detailModalType === "drill" && (
                  <>
                    <div className="sac-detail-item full-width">
                      <span>Drill Title</span>
                      <strong>{detailModalItem.name || detailModalItem.title}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Type</span>
                      <strong>{formatStatus(detailModalItem.type || detailModalItem.drillType)}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Facility</span>
                      <strong>{detailModalItem.facility?.name || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Scheduled Date</span>
                      <strong>{formatDate(detailModalItem.scheduledDate)}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Completed Date</span>
                      <strong>{formatDate(detailModalItem.completedDate)}</strong>
                    </div>
                    <div className="sac-detail-item full-width">
                      <span>Objectives</span>
                      <p>{detailModalItem.objectives || "No objectives listed."}</p>
                    </div>
                    <div className="sac-detail-item full-width">
                      <span>Observations & Lessons Learned</span>
                      <p>{detailModalItem.observations || detailModalItem.lessonsLearned || "None recorded."}</p>
                    </div>
                  </>
                )}

                {/* Training Program Details */}
                {detailModalType === "trainingProgram" && (
                  <>
                    <div className="sac-detail-item">
                      <span>Program Name</span>
                      <strong>{detailModalItem.name}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Course Code</span>
                      <strong>{detailModalItem.code || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Type</span>
                      <strong>{formatStatus(detailModalItem.type)}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Duration (Hours)</span>
                      <strong>{detailModalItem.durationHours || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Frequency</span>
                      <strong>{detailModalItem.frequencyMonths ? `${detailModalItem.frequencyMonths} months` : "One-off"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Validity (Months)</span>
                      <strong>{detailModalItem.validityMonths || "—"}</strong>
                    </div>
                    <div className="sac-detail-item full-width">
                      <span>Description</span>
                      <p>{detailModalItem.description || "No description provided."}</p>
                    </div>
                  </>
                )}

                {/* Training Session Details */}
                {detailModalType === "trainingSession" && (
                  <>
                    <div className="sac-detail-item">
                      <span>Program</span>
                      <strong>{detailModalItem.program?.name || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Trainer</span>
                      <strong>{detailModalItem.trainer || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Scheduled Date</span>
                      <strong>{formatDate(detailModalItem.scheduledDate)}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Facility</span>
                      <strong>{detailModalItem.facility?.name || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Location / Room</span>
                      <strong>{detailModalItem.location || "—"}</strong>
                    </div>
                    <div className="sac-detail-item">
                      <span>Status</span>
                      <span className={`sac-badge ${detailModalItem.status === "completed" ? "active" : "code"}`}>
                        {formatStatus(detailModalItem.status)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="sac-modal-footer">
              <button className="sac-btn secondary" onClick={() => setDetailModalItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
