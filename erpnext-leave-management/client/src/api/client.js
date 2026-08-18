import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getHealth = async () => {
  const res = await apiClient.get("/health");
  return res.data;
};

export const getDashboard = async () => {
  const res = await apiClient.get("/dashboard");
  return res.data.data;
};

export const getEmployees = async () => {
  const res = await apiClient.get("/employees");
  return res.data.data;
};

export const getLeaves = async () => {
  const res = await apiClient.get("/leaves");
  return res.data.data;
};

export const applyLeave = async (leaveData) => {
  const res = await apiClient.post("/leaves", leaveData);
  return res.data;
};
