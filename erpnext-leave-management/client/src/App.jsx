import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { ToastProvider } from "./components/Toast";
import Navbar from "./components/Navbar";
import DashboardPage from "./pages/DashboardPage";
import PaymentsPage from "./pages/PaymentsPage";
import RecoveryAgentPage from "./pages/RecoveryAgentPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AuditTrailPage from "./pages/AuditTrailPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/recovery" element={<RecoveryAgentPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/audit" element={<AuditTrailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </ToastProvider>
    </AppProvider>
  );
}
