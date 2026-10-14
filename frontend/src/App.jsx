import { BrowserRouter } from "react-router-dom";
import { useState } from "react";
import Login from "./pages/Login";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import CompanyAdminDashboard from "./pages/CompanyAdminDashboard";
import {
  getStoredUser,
  logoutUser,
} from "./services/authService";

function AppContent() {
  const [user, setUser] = useState(getStoredUser);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (user.role === "super_admin") {
    return (
      <SuperAdminDashboard
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  if (user.role === "employee") {
    return (
      <EmployeeDashboard
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  if (user.role === "company_admin") {
    return (
      <CompanyAdminDashboard
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h2>Dashboard under development</h2>
      <p>
        The {user.role.replace("_", " ")} dashboard is coming next.
      </p>
      <button onClick={handleLogout}>Logout</button>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}