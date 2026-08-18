import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FilePlus2,
  Calendar,
  User,
  Send,
  AlertCircle,
  CheckCircle2,
  Info,
  Clock,
  Sparkles,
} from "lucide-react";
import { getEmployees, applyLeave } from "../api/client";
import { useToast } from "../components/Toast";

const LEAVE_TYPES = [
  { id: "Privilege Leave", name: "Privilege Leave", desc: "Annual earned leave for vacation, personal travel, or rest (PL)" },
  { id: "Casual Leave", name: "Casual Leave", desc: "Short urgent leaves for unforeseen personal obligations (CL)" },
  { id: "Sick Leave", name: "Sick Leave", desc: "Medical recovery, physician appointments, or illness rest (SL)" },
  { id: "Compensatory Off", name: "Compensatory Off", desc: "Granted in exchange for work rendered on holidays/weekends" },
  { id: "Leave Without Pay", name: "Leave Without Pay", desc: "Unpaid absence approved upon exhaustion of standard quotas" },
];

export default function ApplyLeavePage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    employee: "",
    leave_type: "Privilege Leave",
    from_date: new Date().toISOString().split("T")[0],
    to_date: new Date().toISOString().split("T")[0],
    reason: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const data = await getEmployees();
      setEmployees(data || []);
      if (data && data.length > 0) {
        setFormData((prev) => ({ ...prev, employee: data[0].name }));
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to fetch employee roster", "error");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const calculateDays = () => {
    if (!formData.from_date || !formData.to_date) return 0;
    const start = new Date(formData.from_date);
    const end = new Date(formData.to_date);
    if (end < start) return 0;
    return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const validate = () => {
    const errs = {};
    if (!formData.employee) errs.employee = "Please select an employee";
    if (!formData.leave_type) errs.leave_type = "Please select a leave type";
    if (!formData.from_date) errs.from_date = "From date is required";
    if (!formData.to_date) errs.to_date = "To date is required";
    if (formData.from_date && formData.to_date && formData.from_date > formData.to_date) {
      errs.to_date = "End date cannot be earlier than start date";
    }
    if (!formData.reason || formData.reason.trim().length < 3) {
      errs.reason = "Reason must be at least 3 characters";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      await applyLeave(formData);
      addToast("Leave application successfully submitted to ERPNext!", "success");
      navigate("/leaves");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to submit leave";
      addToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEmployee = employees.find((e) => e.name === formData.employee);

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "800", letterSpacing: "-0.02em" }}>
          Submit Leave Request
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.25rem", fontSize: "0.95rem" }}>
          Fill out the application details to initiate an approval workflow in Frappe / ERPNext
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Employee Selection */}
          <div className="form-group">
            <label className="form-label">
              Select Applicant Employee <span className="required">*</span>
            </label>
            <select
              className="form-control"
              value={formData.employee}
              onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
              disabled={loadingEmployees}
            >
              {loadingEmployees ? (
                <option>Loading employee roster...</option>
              ) : (
                employees.map((emp) => (
                  <option key={emp.name} value={emp.name}>
                    {emp.employee_name} ({emp.name}) – {emp.designation} · {emp.department}
                  </option>
                ))
              )}
            </select>
            {errors.employee && <div className="form-error">{errors.employee}</div>}

            {selectedEmployee && (
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.75rem 1rem",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                }}
              >
                <div>
                  <strong style={{ color: "var(--text-main)" }}>Department:</strong> {selectedEmployee.department}
                </div>
                <div>
                  <strong style={{ color: "var(--text-main)" }}>Designation:</strong> {selectedEmployee.designation}
                </div>
                <div>
                  <strong style={{ color: "var(--text-main)" }}>Status:</strong>{" "}
                  <span style={{ color: "var(--accent-emerald)", fontWeight: "600" }}>{selectedEmployee.status}</span>
                </div>
              </div>
            )}
          </div>

          {/* Leave Type Cards */}
          <div className="form-group">
            <label className="form-label">
              Leave Category <span className="required">*</span>
            </label>
            <div className="leave-types-grid">
              {LEAVE_TYPES.map((t) => (
                <div
                  key={t.id}
                  className={`leave-type-card ${formData.leave_type === t.id ? "selected" : ""}`}
                  onClick={() => setFormData({ ...formData, leave_type: t.id })}
                >
                  <div className="leave-type-title">{t.name}</div>
                  <div className="leave-type-desc">{t.desc}</div>
                </div>
              ))}
            </div>
            {errors.leave_type && <div className="form-error">{errors.leave_type}</div>}
          </div>

          {/* Dates & Day Count */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                From Date <span className="required">*</span>
              </label>
              <input
                type="date"
                className="form-control"
                value={formData.from_date}
                onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
              />
              {errors.from_date && <div className="form-error">{errors.from_date}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">
                To Date <span className="required">*</span>
              </label>
              <input
                type="date"
                className="form-control"
                value={formData.to_date}
                onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
              />
              {errors.to_date && <div className="form-error">{errors.to_date}</div>}
            </div>
          </div>

          {/* Days summary */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1rem 1.25rem",
              background: "rgba(99, 102, 241, 0.08)",
              border: "1px dashed rgba(99, 102, 241, 0.3)",
              borderRadius: "var(--radius-md)",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Calendar size={18} color="var(--primary-400)" />
              <div>
                <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>Total Leave Period</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                  Calculated inclusive of start and end dates
                </div>
              </div>
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--primary-400)" }}>
              {calculateDays()} {calculateDays() === 1 ? "Day" : "Days"}
            </div>
          </div>

          {/* Reason */}
          <div className="form-group">
            <label className="form-label">
              Detailed Reason / Remarks <span className="required">*</span>
            </label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="State the purpose of your leave so your manager can review and approve promptly..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
            {errors.reason && <div className="form-error">{errors.reason}</div>}
          </div>

          {/* Submit Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "1rem",
              marginTop: "2rem",
              borderTop: "1px solid var(--border-subtle)",
              paddingTop: "1.5rem",
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/")}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: "0.75rem 1.75rem" }} disabled={submitting}>
              {submitting ? (
                <>Submitting to ERPNext...</>
              ) : (
                <>
                  <Send size={18} />
                  <span>Send Leave Application</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
