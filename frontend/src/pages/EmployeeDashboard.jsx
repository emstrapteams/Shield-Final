
import { useState } from "react";
import "./EmployeeDashboard.css";
import logo from "../assets/logo.png";
import EmergencyList from "../components/EmergencyList";
import EmergencyForm from "../components/EmergencyForm";
function EmployeeDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("report");

  const getInitials = (name) => {
    if (!name) return "E";

    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="employee-layout">
      <aside className="employee-sidebar">
        <div className="employee-brand">
          <img
            src={logo}
            alt="EMSTRAP"
            className="employee-brand-logo"
          />
          <div>
            <h2>EMSTRAP</h2>
            <span>Shield</span>
          </div>
        </div>

        <div className="employee-nav-label">WORKSPACE</div>

        <nav className="employee-nav">
          <button
            className={activeTab === "report" ? "active" : ""}
            onClick={() => setActiveTab("report")}
          >
            <span className="nav-icon">!</span>
            Report Emergency
          </button>

          <button
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            <span className="nav-icon">≡</span>
            My Emergencies
          </button>
        </nav>

        <div className="employee-sidebar-bottom">
          <div className="employee-user">
            <div className="employee-avatar">
              {getInitials(user?.name)}
            </div>

            <div className="employee-user-info">
              <strong>{user?.name || "Employee"}</strong>
              <span>Employee</span>
            </div>
          </div>

          <button
            className="employee-logout"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="employee-main">
        <header className="employee-topbar">
          <div>
            <h1>
              {activeTab === "report"
                ? "Report an Emergency"
                : "My Emergencies"}
            </h1>

            <p>
              {activeTab === "report"
                ? "Submit an emergency alert to your response team."
                : "View the emergencies you have reported."}
            </p>
          </div>

          <div className="employee-topbar-user">
            <div className="employee-avatar">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        <section className="employee-content">
          {activeTab === "report" ? (
  <EmergencyForm />
) : (
<EmergencyList />
)}
        </section>
      </main>
    </div>
  );
}

export default EmployeeDashboard;