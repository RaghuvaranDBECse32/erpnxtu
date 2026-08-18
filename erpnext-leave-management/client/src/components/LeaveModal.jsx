import React, { useState, useEffect } from "react";
import { X, Send, Calendar, User, FileText, CheckCircle2 } from "lucide-react";
import { getEmployees, applyLeave } from "../api/client";
import { useToast } from "./Toast";

const LEAVE_TYPES = [
  { id: "Privilege Leave", name: "Privilege Leave", desc: "Annual earned leaves for vacation or rest" },
  { id: "Casual Leave", name: "Casual Leave", desc: "For urgent unforeseen personal matters" },
  { id: "Sick Leave", name: "Sick Leave", desc: "Medical illness or health recovery" },
  { id: "Compensatory Off", name: "Compensatory Off", desc: "Comp off for extra shifts/weekends worked" },
  { id: "Leave Without Pay", name: "Leave Without Pay", desc: "Unpaid time off approved by supervisor" },
];

export default function LeaveModal({ isOpen, onClose, onSuccess, preselectedEmployee = "" }) {
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
    if (isOpen) {
      loadEmployees();
      if (preselectedEmployee) {
        setFormData((prev) => ({ ...prev, employee: preselectedEmployee }));
      }
    }
  }, [isOpen, preselectedEmployee]);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const data = await getEmployees();
      setEmployees(data || []);
      if (!formData.employee && data && data.length > 0) {
        setFormData((prev) => ({ ...prev, employee: data[0].name }));
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to load employee list", "error");
    } finally {
      setLoadingEmployees(false);
    }
  };

  if (!isOpen) return null;

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
      addToast("Leave application submitted successfully to ERPNext!", "success");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to submit leave";
      addToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate day count
  const calculateDays = () => {
    if (!formData.from_date || !formData.to_date) return 0;
    const start = new Date(formData.from_date);
    const end = new Date(formData.to_date);
    if (end < start) return 0;
    return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="card-title" style={{ fontSize: "1.25rem" }}>
              <FileText size={20} color="var(--primary-400)" />
              Apply for Leave
            </h2>
            <p className="card-subtitle">Submit leave request directly into ERPNext Frappe workflow</p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Employee Picker */}
          <div className="form-group">
            <label className="form-label">
              Employee <span className="required">*</span>
            </label>
            <select
              className="form-control"
              value={formData.employee}
              onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
              disabled={loadingEmployees}
            >
              {loadingEmployees ? (
                <option>Loading employees...</option>
              ) : (
                employees.map((emp) => (
                  <option key={emp.name} value={emp.name}>
                    {emp.employee_name} ({emp.name}) - {emp.department}
                  </option>
                ))
              )}
            </select>
            {errors.employee && <div className="form-error">{errors.employee}</div>}
          </div>

          {/* Leave Type Selector */}
          <div className="form-group">
            <label className="form-label">
              Leave Type <span className="required">*</span>
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
          </div>

          {/* Date Picker Grid */}
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

          {/* Duration Summary Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              background: "rgba(99, 102, 241, 0.08)",
              border: "1px dashed rgba(99, 102, 241, 0.3)",
              borderRadius: "var(--radius-md)",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
              <Calendar size={16} color="var(--primary-400)" />
              <span style={{ color: "var(--text-muted)" }}>Total Requested Duration:</span>
            </div>
            <span style={{ fontWeight: "700", color: "var(--primary-400)", fontSize: "0.95rem" }}>
              {calculateDays()} Day{calculateDays() === 1 ? "" : "s"}
            </span>
          </div>

          {/* Reason */}
          <div className="form-group">
            <label className="form-label">
              Reason for Leave <span className="required">*</span>
            </label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Please provide details about your leave request..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
            {errors.reason && <div className="form-error">{errors.reason}</div>}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <>Submitting...</>
              ) : (
                <>
                  <Send size={16} />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
