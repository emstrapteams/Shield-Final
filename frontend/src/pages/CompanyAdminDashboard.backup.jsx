import { useEffect, useMemo, useRef, useState } from "react";
import { MemoryRouter } from "react-router-dom";
import logo from "../assets/logo.png";
import { logoutUser, getStoredToken } from "../services/authService";
import {
  getCompanyEmergencies,
  acknowledgeEmergency,
  startEmergencyResponse,
  resolveEmergency,
  closeEmergency,
} from "../services/emergencyService";
import { connectSocket, disconnectSocket } from "../services/socketService";
import "./CompanyAdminDashboard.css";

import Dashboard from "../intern-pages/Dashboard";
import Employees from "../intern-pages/Employees";
import Departments from "../intern-pages/Departments";
import Facilities from "../intern-pages/Facilities";
import Equipment from "../intern-pages/Equipment";
import FireExtinguishers from "../intern-pages/FireExtinguishers";
import FirstAidKits from "../intern-pages/FirstAidKits";
import Inspections from "../intern-pages/Inspections";
import CorrectiveActions from "../intern-pages/CorrectiveActions";
import EmergencyResources from "../intern-pages/EmergencyResources";
import Drills from "../intern-pages/Drills";
import TrainingPrograms from "../intern-pages/TrainingPrograms";
import TrainingSessions from "../intern-pages/TrainingSessions";
import Reports from "../intern-pages/Reports";


const statusOptions = [
  "triggered",
  "alert_created",
  "response_in_progress",
  "resolved",
  "closed",
  "cancelled",
];

const typeOptions = [
  "medical",
  "fire",
  "accident",
  "electrical",
  "chemical",
  "gas",
  "vehicle",
  "equipment",
  "security",
  "other",
];

const formatStatus = (status = "") =>
  status.replaceAll("_", " ").replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  return Number.isNaN(parsedDate.getTime())
    ? "—"
    : parsedDate.toLocaleString();
};

function CompanyAdminDashboard({ user, onLogout }) {
  const detailsSectionRef = useRef(null);

  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [activeSection, setActiveSection] = useState("overview");

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEmergencies = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await getCompanyEmergencies();

      const emergencyList =
        response?.data?.emergencies ||
        response?.emergencies ||
        [];

      setEmergencies(emergencyList);

      // Keep the selected emergency synchronized with the server.
      setSelectedEmergency((current) => {
        if (!current) return null;

        const currentId = current._id || current.id;

        return (
          emergencyList.find(
            (item) => (item._id || item.id) === currentId
          ) || current
        );
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load emergencies. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
    // Initial data fetch only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Keep the Company Admin dashboard synchronized in real time.
useEffect(() => {
  const token = getStoredToken();

  if (!token) {
    console.warn("No authentication token found for Socket.IO.");
    return undefined;
  }

  const socket = connectSocket(token);

  if (!socket) {
    return undefined;
  }

  const handleEmergencyChange = () => {
    fetchEmergencies(true);
  };

  socket.on("emergency:created", handleEmergencyChange);
  socket.on("emergency:updated", handleEmergencyChange);

  return () => {
    socket.off("emergency:created", handleEmergencyChange);
    socket.off("emergency:updated", handleEmergencyChange);
    disconnectSocket();
  };

  // Set up listeners once when the dashboard mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  // Automatically scroll to the details panel when an emergency is selected.
  useEffect(() => {
    if (selectedEmergency && activeSection === "emergencies") {
      requestAnimationFrame(() => {
        detailsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, [selectedEmergency, activeSection]);

  const filteredEmergencies = useMemo(
    () =>
      emergencies.filter((emergency) => {
        const matchesStatus =
          !statusFilter || emergency.status === statusFilter;

        const matchesType =
          !typeFilter || emergency.type === typeFilter;

        const employeeName =
          emergency.reportedBy?.name ||
          emergency.reportedBy?.email ||
          "";

        const description = emergency.description || "";
        const term = searchTerm.toLowerCase();

        const matchesSearch =
          !term ||
          employeeName.toLowerCase().includes(term) ||
          description.toLowerCase().includes(term) ||
          (emergency.type || "").toLowerCase().includes(term);

        return matchesStatus && matchesType && matchesSearch;
      }),
    [emergencies, statusFilter, typeFilter, searchTerm]
  );

  const counts = useMemo(() => {
    const countStatus = (status) =>
      emergencies.filter((item) => item.status === status).length;

    return {
      total: emergencies.length,
      triggered: countStatus("triggered"),
      inProgress: countStatus("response_in_progress"),
      resolved: countStatus("resolved"),
      cancelled: countStatus("cancelled"),
    };
  }, [emergencies]);

  const handleLogout = () => {
    logoutUser();
    onLogout();
  };

  const sectionTitles = {
    overview: "Company Admin Overview",
    emergencies: "Emergency Monitoring",
    safetyDashboard: "Safety Dashboard",
    employees: "Employee Management",
    departments: "Department Management",
    facilities: "Facility Management",
    equipment: "Safety Equipment",
    fireExtinguishers: "Fire Extinguisher Management",
    firstAidKits: "First-Aid Kit Management",
    inspections: "Safety Inspections",
    correctiveActions: "Corrective Actions",
    emergencyResources: "Emergency Resources",
    drills: "Emergency Drills",
    trainingPrograms: "Training Programs",
    trainingSessions: "Training Sessions",
    reports: "Safety Reports",
  };

  const performLifecycleAction = async (action) => {
    if (!selectedEmergency || actionLoading) return;

    const emergencyId =
      selectedEmergency._id || selectedEmergency.id;

    setActionLoading(true);
    setActionError("");

    try {
      let response;

      if (action === "acknowledge") {
        response = await acknowledgeEmergency(emergencyId);
      } else if (action === "start") {
        response = await startEmergencyResponse(emergencyId);
      } else if (action === "resolve") {
        const note = window.prompt(
          "Enter a resolution note (optional):",
          ""
        );

        if (note === null) return;

        response = await resolveEmergency(emergencyId, note);
      } else if (action === "close") {
        const note = window.prompt(
          "Enter a closure note (optional):",
          ""
        );

        if (note === null) return;

        response = await closeEmergency(emergencyId, note);
      } else {
        return;
      }

      const updatedEmergency = response?.data?.emergency;

      if (!updatedEmergency) {
        throw new Error(
          "The server did not return the updated emergency."
        );
      }

      // Update the details panel immediately.
      setSelectedEmergency(updatedEmergency);

      // Update the corresponding table row and dashboard counts.
      setEmergencies((current) =>
        current.map((item) =>
          (item._id || item.id) === emergencyId
            ? { ...item, ...updatedEmergency }
            : item
        )
      );

      // Refresh from the server to keep the dashboard synchronized.
      await fetchEmergencies(true);
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          err.message ||
          "The emergency action failed. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const lifecycleActions = {
    triggered: {
      label: "Acknowledge Emergency",
      action: "acknowledge",
    },
    alert_created: {
      label: "Start Response",
      action: "start",
    },
    response_in_progress: {
      label: "Resolve Emergency",
      action: "resolve",
    },
    resolved: {
      label: "Close Emergency",
      action: "close",
    },
  };

  const openEmergencyDetails = (emergency) => {
    setSelectedEmergency(emergency);
    setActiveSection("emergencies");
    setActionError("");
  };

  return (
    <div className="ca-layout">
      <aside className="ca-sidebar">
        <div className="ca-sidebar-brand">
          <img src={logo} alt="EMSTRAP Logo" />
          <div>
            <strong>EMSTRAP</strong>
            <span>Shield</span>
          </div>
        </div>

        <div className="ca-sidebar-label">MAIN MENU</div>

        <nav className="ca-sidebar-nav">
          <button
            className={`ca-nav-item ${
              activeSection === "overview" ? "active" : ""
            }`}
            onClick={() => {
              setActiveSection("overview");
              setSelectedEmergency(null);
              setActionError("");
            }}
          >
            <span>▦</span> Overview
          </button>

          <button
            className={`ca-nav-item ${
              activeSection === "emergencies" ? "active" : ""
            }`}
            onClick={() => {
              setActiveSection("emergencies");
              setSelectedEmergency(null);
              setActionError("");
            }}
          >
            <span>⚠</span> Emergencies
          </button>

          {[
            ["safetyDashboard", "Safety Dashboard", "▦"],
            ["employees", "Employees", "♙"],
            ["departments", "Departments", "▤"],
            ["facilities", "Facilities", "⌂"],
            ["equipment", "Safety Equipment", "⚙"],
            ["fireExtinguishers", "Fire Extinguishers", "♨"],
            ["firstAidKits", "First-Aid Kits", "+"],
            ["inspections", "Inspections", "✓"],
            ["correctiveActions", "Corrective Actions", "↗"],
            ["emergencyResources", "Emergency Resources", "✚"],
            ["drills", "Emergency Drills", "⚑"],
            ["trainingPrograms", "Training Programs", "▣"],
            ["trainingSessions", "Training Sessions", "▣"],
            ["reports", "Reports", "▥"],
          ].map(([section, label, icon]) => (
            <button
              key={section}
              className={`ca-nav-item ${activeSection === section ? "active" : ""}`}
              onClick={() => {
                setActiveSection(section);
                setSelectedEmergency(null);
                setActionError("");
                setError("");
              }}
            >
              <span>{icon}</span> {label}
            </button>
          ))}
        </nav>

        <div className="ca-sidebar-bottom">
          <div className="ca-sidebar-user">
            <div className="ca-avatar">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>

            <div className="ca-user-info">
              <strong>{user?.name}</strong>
              <span>Company Admin</span>
            </div>
          </div>

          <button
            className="ca-logout-button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="ca-main">
        <header className="ca-header">
          <div>
            <span className="ca-eyebrow">WORKSPACE</span>
            <h1>{sectionTitles[activeSection]}</h1>
          </div>

          <div className="ca-header-profile">
            <div className="ca-header-avatar">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>

            <div>
              <strong>{user?.name}</strong>
              <span>Company Admin</span>
            </div>
          </div>
        </header>

        <section className="ca-content">
          {error && (
            <div className="ca-alert error" role="alert">
              {error}
            </div>
          )}

          {activeSection === "overview" && (
            <>
              <div className="ca-welcome-row">
                <div>
                  <h2>
                    Welcome back, {user?.name?.split(" ")[0]}.
                  </h2>
                  <p>
                    Monitor emergencies and coordinate workplace
                    safety responses.
                  </p>
                </div>

                <button
                  className="ca-primary-button"
                  onClick={() => setActiveSection("emergencies")}
                >
                  View Emergencies
                </button>
              </div>

              <div className="ca-stats-grid">
                {[
                  [
                    "total",
                    "Total Emergencies",
                    counts.total,
                    "Recorded emergencies",
                  ],
                  [
                    "triggered",
                    "Triggered",
                    counts.triggered,
                    "Awaiting response",
                  ],
                  [
                    "progress",
                    "In Progress",
                    counts.inProgress,
                    "Response underway",
                  ],
                  [
                    "resolved",
                    "Resolved",
                    counts.resolved,
                    "Successfully resolved",
                  ],
                  [
                    "cancelled",
                    "Cancelled",
                    counts.cancelled,
                    "Cancelled reports",
                  ],
                ].map(([icon, label, count, caption]) => (
                  <div className="ca-stat-card" key={label}>
                    <div className={`ca-stat-icon ${icon}`}>
                      {icon === "total"
                        ? "▤"
                        : icon === "progress"
                          ? "↻"
                          : icon === "resolved"
                            ? "✓"
                            : icon === "cancelled"
                              ? "×"
                              : "!"}
                    </div>

                    <span>{label}</span>
                    <strong>{count}</strong>
                    <small>{caption}</small>
                  </div>
                ))}
              </div>

              <section className="ca-panel">
                <div className="ca-panel-heading">
                  <div>
                    <h3>Recent Emergencies</h3>
                    <p>
                      The latest emergency reports from your company.
                    </p>
                  </div>

                  <button
                    className="ca-secondary-button"
                    onClick={() => fetchEmergencies(true)}
                    disabled={refreshing}
                  >
                    {refreshing ? "Refreshing..." : "↻ Refresh"}
                  </button>
                </div>

                {loading ? (
                  <div className="ca-empty-state">
                    Loading emergencies...
                  </div>
                ) : emergencies.length === 0 ? (
                  <div className="ca-empty-state">
                    <h4>No emergencies recorded</h4>
                    <p>
                      Emergency reports from employees will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="ca-table-wrapper">
                    <table className="ca-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Reported</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {emergencies.slice(0, 5).map((emergency) => (
                          <tr
                            key={emergency._id || emergency.id}
                          >
                            <td>
                              <strong>
                                {emergency.reportedBy?.name ||
                                  emergency.reportedBy?.email ||
                                  "Unknown employee"}
                              </strong>
                            </td>

                            <td>{formatStatus(emergency.type)}</td>

                            <td>
                              <span
                                className={`ca-status-badge ${emergency.status}`}
                              >
                                {formatStatus(emergency.status)}
                              </span>
                            </td>

                            <td>{formatDate(emergency.createdAt)}</td>

                            <td>
                              <button
                                className="ca-view-button"
                                onClick={() =>
                                  openEmergencyDetails(emergency)
                                }
                              >
                                View
                              </button>
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

          {activeSection === "emergencies" && (
            <>
              <div className="ca-welcome-row">
                <div>
                  <h2>Emergency Monitoring</h2>
                  <p>
                    View and monitor emergency reports submitted by
                    employees in your company.
                  </p>
                </div>

                <button
                  className="ca-secondary-button"
                  onClick={() => fetchEmergencies(true)}
                  disabled={refreshing}
                >
                  {refreshing ? "Refreshing..." : "↻ Refresh"}
                </button>
              </div>

              <section className="ca-panel">
                <div className="ca-filter-row">
                  <input
                    type="text"
                    placeholder="Search employee, type, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="">All Types</option>
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>
                        {formatStatus(type)}
                      </option>
                    ))}
                  </select>

                  <button
                    className="ca-clear-button"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("");
                      setTypeFilter("");
                    }}
                  >
                    Clear
                  </button>
                </div>

                <div className="ca-results-label">
                  Showing {filteredEmergencies.length} of{" "}
                  {emergencies.length} emergencies
                </div>

                {loading ? (
                  <div className="ca-empty-state">
                    Loading emergencies...
                  </div>
                ) : filteredEmergencies.length === 0 ? (
                  <div className="ca-empty-state">
                    <h4>No matching emergencies</h4>
                    <p>
                      Try changing your filters or search term.
                    </p>
                  </div>
                ) : (
                  <div className="ca-table-wrapper">
                    <table className="ca-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th>Location</th>
                          <th>Reported</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredEmergencies.map((emergency) => (
                          <tr
                            key={emergency._id || emergency.id}
                          >
                            <td>
                              <strong>
                                {emergency.reportedBy?.name ||
                                  emergency.reportedBy?.email ||
                                  "Unknown employee"}
                              </strong>
                            </td>

                            <td>{formatStatus(emergency.type)}</td>

                            <td className="ca-description-cell">
                              {emergency.description || "—"}
                            </td>

                            <td>
                              <span
                                className={`ca-status-badge ${emergency.status}`}
                              >
                                {formatStatus(emergency.status)}
                              </span>
                            </td>

                            <td>
                              {emergency.location?.address ||
                                (emergency.location?.latitude != null &&
                                emergency.location?.longitude != null
                                  ? `${emergency.location.latitude}, ${emergency.location.longitude}`
                                  : "—")}
                            </td>

                            <td>{formatDate(emergency.createdAt)}</td>

                            <td>
                              <button
                                className="ca-view-button"
                                onClick={() =>
                                  openEmergencyDetails(emergency)
                                }
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
              </section>

              {selectedEmergency && (
                <section
                  ref={detailsSectionRef}
                  className="ca-panel ca-details-panel"
                >
                  <div className="ca-panel-heading">
                    <div>
                      <h3>Emergency Details</h3>
                      <p>
                        Reference:{" "}
                        {selectedEmergency._id ||
                          selectedEmergency.id ||
                          "Unavailable"}
                      </p>
                    </div>

                    <button
                      className="ca-secondary-button"
                      onClick={() => {
                        setSelectedEmergency(null);
                        setActionError("");
                      }}
                    >
                      Close Details
                    </button>
                  </div>

                  {actionError && (
                    <div className="ca-alert error" role="alert">
                      {actionError}
                    </div>
                  )}

                  <div className="ca-details-grid">
                    <div className="ca-detail-item">
                      <span>Reported By</span>
                      <strong>
                        {selectedEmergency.reportedBy?.name ||
                          selectedEmergency.reportedBy?.email ||
                          "Unknown employee"}
                      </strong>
                    </div>

                    <div className="ca-detail-item">
                      <span>Emergency Type</span>
                      <strong>
                        {formatStatus(selectedEmergency.type)}
                      </strong>
                    </div>

                    <div className="ca-detail-item">
                      <span>Status</span>
                      <strong>
                        {formatStatus(selectedEmergency.status)}
                      </strong>
                    </div>

                    <div className="ca-detail-item">
                      <span>Reported At</span>
                      <strong>
                        {formatDate(selectedEmergency.createdAt)}
                      </strong>
                    </div>

                    <div className="ca-detail-item">
                      <span>Last Updated</span>
                      <strong>
                        {formatDate(selectedEmergency.updatedAt)}
                      </strong>
                    </div>

                    <div className="ca-detail-item">
                      <span>Resolved At</span>
                      <strong>
                        {formatDate(selectedEmergency.resolvedAt)}
                      </strong>
                    </div>

                    <div className="ca-detail-item full-width">
                      <span>Description</span>
                      <p>
                        {selectedEmergency.description ||
                          "No description provided."}
                      </p>
                    </div>

                    <div className="ca-detail-item full-width">
                      <span>Location</span>
                      <p>
                        {selectedEmergency.location?.address ||
                          "Address not available"}
                      </p>

                      {selectedEmergency.location?.latitude != null &&
                        selectedEmergency.location?.longitude != null && (
                          <p>
                            Latitude:{" "}
                            {selectedEmergency.location.latitude}
                            {" | "}
                            Longitude:{" "}
                            {selectedEmergency.location.longitude}
                          </p>
                        )}
                    </div>

                    {selectedEmergency.cancellationReason && (
                      <div className="ca-detail-item full-width">
                        <span>Cancellation Reason</span>
                        <p>
                          {selectedEmergency.cancellationReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {lifecycleActions[selectedEmergency.status] && (
                    <div className="ca-lifecycle-actions">
                      <button
                        className="ca-primary-button"
                        disabled={actionLoading}
                        onClick={() =>
                          performLifecycleAction(
                            lifecycleActions[selectedEmergency.status]
                              .action
                          )
                        }
                      >
                        {actionLoading
                          ? "Processing..."
                          : lifecycleActions[selectedEmergency.status].label}
                      </button>
                    </div>
                  )}

                  <div className="ca-history-section">
                    <h4>Response History</h4>

                    {!selectedEmergency.responseHistory?.length ? (
                      <p className="ca-no-evidence">
                        No response history recorded.
                      </p>
                    ) : (
                      <ol className="ca-history-list">
                        {selectedEmergency.responseHistory.map(
                          (event, index) => (
                            <li
                              key={
                                event._id ||
                                `${event.action}-${index}`
                              }
                            >
                              <strong>
                                {formatStatus(event.action)}
                              </strong>

                              <span>
                                {formatDate(event.timestamp)}
                              </span>

                              <p>
                                {event.note || "No note provided."}
                              </p>

                              {event.performedBy && (
                                <small>
                                  User ID:{" "}
                                  {typeof event.performedBy === "object"
                                    ? event.performedBy._id
                                    : event.performedBy}
                                </small>
                              )}
                            </li>
                          )
                        )}
                      </ol>
                    )}
                  </div>

                  <div className="ca-evidence-section">
                    <h4>
                      Uploaded Evidence (
                      {selectedEmergency.evidence?.length || 0})
                    </h4>

                    {!selectedEmergency.evidence?.length ? (
                      <p className="ca-no-evidence">
                        No evidence uploaded.
                      </p>
                    ) : (
                      <div className="ca-evidence-grid">
                        {selectedEmergency.evidence.map(
                          (item, index) => (
                            <div
                              className="ca-evidence-item"
                              key={
                                item.publicId || item.url || index
                              }
                            >
                              {item.mediaType === "video" ? (
                                <video
                                  src={item.url}
                                  controls
                                  preload="metadata"
                                />
                              ) : (
                                <img
                                  src={item.url}
                                  alt={`Emergency evidence ${index + 1}`}
                                />
                              )}

                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open original
                              </a>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}
            </>
          )}

          {activeSection !== "overview" && activeSection !== "emergencies" && (
            <MemoryRouter>
              <div className="intern-module-wrapper">
                {activeSection === "safetyDashboard" && <Dashboard />}
                {activeSection === "employees" && <Employees />}
                {activeSection === "departments" && <Departments />}
                {activeSection === "facilities" && <Facilities />}
                {activeSection === "equipment" && <Equipment />}
                {activeSection === "fireExtinguishers" && <FireExtinguishers />}
                {activeSection === "firstAidKits" && <FirstAidKits />}
                {activeSection === "inspections" && <Inspections />}
                {activeSection === "correctiveActions" && <CorrectiveActions />}
                {activeSection === "emergencyResources" && <EmergencyResources />}
                {activeSection === "drills" && <Drills />}
                {activeSection === "trainingPrograms" && <TrainingPrograms />}
                {activeSection === "trainingSessions" && <TrainingSessions />}
                {activeSection === "reports" && <Reports />}
              </div>
            </MemoryRouter>
          )}
        </section>
      </main>
    </div>
  );
}

export default CompanyAdminDashboard;