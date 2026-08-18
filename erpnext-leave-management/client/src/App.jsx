import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import LeaveModal from "./components/LeaveModal";
import DashboardPage from "./pages/DashboardPage";
import LeavesPage from "./pages/LeavesPage";
import ApplyLeavePage from "./pages/ApplyLeavePage";
import EmployeesPage from "./pages/EmployeesPage";
import { ToastProvider } from "./components/Toast";
import { getHealth } from "./api/client";

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preselectedEmp, setPreselectedEmp] = useState("");
  const [serverConnected, setServerConnected] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Check health periodically
  useEffect(() => {
    const checkServer = async () => {
      try {
        await getHealth();
        setServerConnected(true);
      } catch (err) {
        setServerConnected(false);
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleOpenModal = (employeeId = "") => {
    setPreselectedEmp(typeof employeeId === "string" ? employeeId : "");
    setIsModalOpen(true);
  };

  return (
    <ToastProvider>
      <div className="app-container">
        <Navbar
          onOpenModal={() => handleOpenModal("")}
          theme={theme}
          onToggleTheme={toggleTheme}
          serverConnected={serverConnected}
        />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<DashboardPage onOpenModal={() => handleOpenModal("")} />} />
            <Route path="/leaves" element={<LeavesPage onOpenModal={() => handleOpenModal("")} />} />
            <Route path="/apply" element={<ApplyLeavePage />} />
            <Route
              path="/employees"
              element={<EmployeesPage onOpenModalWithEmp={(empId) => handleOpenModal(empId)} />}
            />
          </Routes>
        </main>

        <LeaveModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          preselectedEmployee={preselectedEmp}
          onSuccess={() => {
            // Trigger auto reload or update
            window.dispatchEvent(new Event("leave-updated"));
          }}
        />
      </div>
    </ToastProvider>
  );
}
