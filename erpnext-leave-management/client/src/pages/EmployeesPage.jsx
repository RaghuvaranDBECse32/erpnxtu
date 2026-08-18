import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Building,
  Briefcase,
  PlusCircle,
  CalendarCheck,
  RefreshCw,
  Mail,
} from "lucide-react";
import { getEmployees } from "../api/client";
import { useToast } from "../components/Toast";

export default function EmployeesPage({ onOpenModalWithEmp }) {
  const { addToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  const fetchEmployees = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const data = await getEmployees();
      setEmployees(data || []);
      if (showToast) addToast("Employee roster updated", "info");
    } catch (err) {
      console.error(err);
      addToast("Failed to fetch employees", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const departments = useMemo(() => {
    const deps = new Set(employees.map((e) => e.department).filter(Boolean));
    return Array.from(deps);
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.designation && emp.designation.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDept =
        departmentFilter === "ALL" || emp.department === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [employees, searchQuery, departmentFilter]);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "800", letterSpacing: "-0.02em" }}>
            Employee Directory
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.25rem", fontSize: "0.95rem" }}>
            View active staff roster and quick-launch leave applications
          </p>
        </div>

        <button onClick={() => fetchEmployees(true)} className="btn btn-secondary" disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1.25rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-dim)",
              }}
            />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: "2.75rem" }}
              placeholder="Search by name, ID, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <select
              className="form-control"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="ALL">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Employees Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
          Loading employee records...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {filteredEmployees.map((emp) => (
            <div key={emp.name} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1rem" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "var(--radius-md)",
                      background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))",
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "800",
                      color: "var(--primary-400)",
                    }}
                  >
                    {emp.employee_name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>{emp.employee_name}</h3>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)" }}>
                      {emp.name}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Briefcase size={15} color="var(--primary-400)" />
                    <span>{emp.designation || "Not Assigned"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Building size={15} color="var(--primary-400)" />
                    <span>{emp.department || "General"}</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: "1.25rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "var(--accent-emerald)",
                    background: "rgba(16, 185, 129, 0.1)",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "var(--radius-full)",
                  }}
                >
                  {emp.status}
                </span>

                <button
                  onClick={() => onOpenModalWithEmp(emp.name)}
                  className="btn btn-outline"
                  style={{ fontSize: "0.775rem", padding: "0.35rem 0.75rem" }}
                >
                  <CalendarCheck size={14} />
                  <span>Request Leave</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
