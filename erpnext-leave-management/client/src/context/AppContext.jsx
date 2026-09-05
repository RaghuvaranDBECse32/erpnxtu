import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchSummary, checkHealth } from "../api/client";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [demoMode, setDemoMode] = useState(true);
  const [dbMode, setDbMode] = useState("in-memory");
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToastMessage({ message: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const res = await fetchSummary();
      if (res && res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn("Failed to fetch summary stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const refreshHealth = useCallback(async () => {
    try {
      const h = await checkHealth();
      if (h) {
        setDemoMode(h.mode === "demo");
        setDbMode(h.database || "in-memory");
      }
    } catch (e) {
      console.warn("Backend health check failed, default to demo mode");
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    refreshStats();
  }, [refreshHealth, refreshStats]);

  return (
    <AppContext.Provider
      value={{
        demoMode,
        setDemoMode,
        dbMode,
        stats,
        loadingStats,
        refreshStats,
        showToast,
        toastMessage,
        setToastMessage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return ctx;
}
