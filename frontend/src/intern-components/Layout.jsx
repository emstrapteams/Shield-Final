import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function Layout() {
  const linkClass = ({ isActive }) =>
    "nav-link" + (isActive ? " active" : "");

  return (
    <div className="app-shell">
      <aside className="sidebar">

        <div className="brand">
          <img
            src="/logo.png"
            alt="EMSTRAP"
            className="brand-logo"
          />

          <div>
            <div className="brand-title">EMSTRAP Shield</div>
            
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/employees" className={linkClass}>
            Employees
          </NavLink>

          <NavLink to="/departments" className={linkClass}>
            Departments
          </NavLink>

          <NavLink to="/facilities" className={linkClass}>
            Facilities
          </NavLink>

          <NavLink to="/equipment" className={linkClass}>
            Safety Equipment
          </NavLink>

          <NavLink to="/fire-extinguishers" className={linkClass}>
            Fire Extinguishers
          </NavLink>

          <NavLink to="/first-aid-kits" className={linkClass}>
            First-Aid Kits
          </NavLink>

          <NavLink to="/inspections" className={linkClass}>
            Inspections
          </NavLink>

          <NavLink to="/corrective-actions" className={linkClass}>
            Corrective Actions

          </NavLink>
          <NavLink to="/emergency-resources" className={linkClass}>
  Emergency Resources
</NavLink>

<NavLink to="/training-dashboard" className={linkClass}>
  Training Dashboard
</NavLink>

<NavLink to="/training-programs" className={linkClass}>
  Training Programs
</NavLink>

<NavLink to="/training-sessions" className={linkClass}>
  Training Sessions
</NavLink>

<NavLink to="/drills" className={linkClass}>
  Emergency Drills
</NavLink>
<NavLink to="/dashboard" className={linkClass}>
  Dashboard
</NavLink>

<NavLink to="/reports" className={linkClass}>
  Reports
</NavLink>

<NavLink to="/companies" className={linkClass}>
  Companies
</NavLink>

<NavLink to="/audit-logs" className={linkClass}>
  Audit Logs
</NavLink>
        </nav>

      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}