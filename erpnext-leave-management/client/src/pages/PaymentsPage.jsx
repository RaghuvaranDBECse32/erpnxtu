import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Zap,
  CreditCard,
  Plus,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
  Database,
} from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import Spinner from "../components/Spinner";
import PaymentDetailModal from "../components/PaymentDetailModal";
import { fetchPayments, createPaymentOrder } from "../api/client";
import { useApp } from "../context/AppContext";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [creating, setCreating] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const { showToast, refreshStats } = useApp();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchPayments({ limit: 100 });
      if (res && res.data) {
        setPayments(res.data);
      }
    } catch (err) {
      showToast("Failed to fetch payments: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSimulatePayment = async (simulateFailure = true) => {
    try {
      setCreating(true);
      const names = ["Aarav Sharma", "Pooja Patel", "Rohan Mehta", "Sneha Rao", "Vikram Reddy"];
      const randomName = names[Math.floor(Math.random() * names.length)];
      const res = await createPaymentOrder({
        amount: Math.floor(Math.random() * 4000) + 1200,
        customerName: randomName,
        customerEmail: randomName.toLowerCase().replace(" ", ".") + "@example.in",
        customerPhone: "+91 98765" + Math.floor(Math.random() * 90000 + 10000),
        paymentMethod: ["UPI", "CARD", "NETBANKING"][Math.floor(Math.random() * 3)],
        simulateFailure,
      });

      if (res.success) {
        showToast(
          simulateFailure
            ? "New failed payment registered and queued for agent recovery!"
            : "Successful test order created!",
          "success"
        );
        await loadData();
        refreshStats();
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setCreating(false);
    }
  };

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        (p.payment_id && p.payment_id.toLowerCase().includes(q)) ||
        (p.customer_name && p.customer_name.toLowerCase().includes(q)) ||
        (p.customer_email && p.customer_email.toLowerCase().includes(q)) ||
        (p.failure_reason && p.failure_reason.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "ALL" ||
        (p.status || "").toUpperCase() === statusFilter ||
        (p.payment_status || "").toUpperCase() === statusFilter;

      const matchesMethod =
        methodFilter === "ALL" || (p.payment_method || "").toUpperCase() === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [payments, search, statusFilter, methodFilter]);

  const formatINR = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
          gap: "0.85rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#fff" }}>
              Payments Telemetry Repository
            </h1>
            <span
              style={{
                fontSize: "0.68rem",
                padding: "0.15rem 0.5rem",
                background: "rgba(99, 102, 241, 0.12)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                color: "var(--brand-primary-light)",
                borderRadius: "var(--radius-full)",
                fontWeight: 700,
              }}
            >
              {filtered.length} Indexed
            </span>
          </div>
          <p style={{ fontSize: "0.74rem", color: "var(--text-dim)", marginTop: "2px" }}>
            Razorpay payment events mirrored into Exasol in-memory columnar store for real-time recovery scoring.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleSimulatePayment(true)}
            disabled={creating}
          >
            <Plus size={13} />
            <span>Simulate Payment Failure</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="card"
        style={{
          padding: "0.85rem 1rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.85rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-dim)",
            }}
          />
          <input
            type="text"
            className="input-field page-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Payment ID, Customer name, email, or failure reason..."
            style={{ paddingLeft: "2rem" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontWeight: 600 }}>Status:</span>
            <select
              className="select-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: "130px", padding: "0.35rem 0.65rem" }}
            >
              <option value="ALL">All Statuses</option>
              <option value="FAILED">Failed</option>
              <option value="RECOVERING">Recovering</option>
              <option value="RECOVERED">Recovered</option>
              <option value="STOPPED">Stopped</option>
              <option value="SUCCESS">Success</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontWeight: 600 }}>Method:</span>
            <select
              className="select-field"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              style={{ width: "120px", padding: "0.35rem 0.65rem" }}
            >
              <option value="ALL">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="NETBANKING">Net Banking</option>
              <option value="WALLET">Wallet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="table-wrapper">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Failure Reason</th>
                <th>Status</th>
                <th>AI Decision</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "3rem" }}>
                    <Spinner size="md" />
                    <div style={{ marginTop: "0.5rem", color: "var(--text-dim)", fontSize: "0.74rem" }}>
                      Querying Exasol in-memory telemetry records...
                    </div>
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((p) => (
                  <tr
                    key={p.payment_id}
                    onClick={() => setSelectedPayment(p)}
                    style={{ cursor: "pointer" }}
                    title="Click to view detailed payment profile"
                  >
                    <td className="table-cell-mono">{p.payment_id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#fff" }}>{p.customer_name}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>
                        {p.customer_email}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: "#fff" }}>{formatINR(p.amount)}</td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          padding: "2px 7px",
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: "var(--radius-xs)",
                          color: "var(--text-secondary)",
                          fontWeight: 500,
                        }}
                      >
                        {p.payment_method || "UPI"}
                      </span>
                    </td>
                    <td
                      style={{
                        color: p.failure_reason ? "var(--accent-rose-light)" : "var(--text-dim)",
                        fontWeight: p.failure_reason ? 600 : 400,
                        fontSize: "0.76rem",
                      }}
                    >
                      {p.failure_reason || "None (Success)"}
                    </td>
                    <td>
                      <StatusBadge status={p.status || p.payment_status} />
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          color: "var(--brand-primary-light)",
                        }}
                      >
                        {p.ai_action || (p.status === "RECOVERED" ? "Recovered" : "Smart Retry")}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                      {p.created_at
                        ? new Date(p.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Today"}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setSelectedPayment(p)}
                        style={{ padding: "0.22rem 0.55rem", fontSize: "0.7rem" }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "3rem", color: "var(--text-dim)" }}>
                    No transactions match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onRecoverySuccess={loadData}
        />
      )}
    </div>
  );
}
