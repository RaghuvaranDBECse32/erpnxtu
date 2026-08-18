import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CalendarDays,
  LayoutDashboard,
  FilePlus2,
  ListOrdered,
  Users,
  Sun,
  Moon,
  PlusCircle,
  Activity,
} from "lucide-react";

export default function Navbar({ onOpenModal, theme, onToggleTheme, serverConnected }) {
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Leave Requests", path: "/leaves", icon: ListOrdered },
    { label: "Apply Leave", path: "/apply", icon: FilePlus2 },
    { label: "Employees", path: "/employees", icon: Users },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand-logo">
          <div className="brand-icon-wrapper">
            <CalendarDays size={22} />
          </div>
          <div>
            <span>ERPNext</span>
            <span style={{ color: "var(--primary-400)", marginLeft: "4px" }}>Leave Hub</span>
          </div>
          <span className="brand-badge">Frappe HR</span>
        </Link>

        <nav className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? "active" : ""}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="nav-actions">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.75rem",
              color: serverConnected ? "var(--accent-emerald)" : "var(--accent-amber)",
              background: serverConnected ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
              border: `1px solid ${serverConnected ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)"}`,
            }}
            title={serverConnected ? "Connected to Backend API" : "Connecting to Backend API..."}
          >
            <Activity size={12} className={serverConnected ? "" : "animate-pulse"} />
            <span>{serverConnected ? "API Online" : "Connecting"}</span>
          </div>

          <button
            onClick={onToggleTheme}
            className="btn-icon"
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button onClick={onOpenModal} className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Quick Apply</span>
          </button>
        </div>
      </div>
    </header>
  );
}
