/**
 * erpnextService.js – reusable Axios client for the Frappe/ERPNext REST API.
 *
 * All calls go through `/api/resource` using token-based authentication.
 * If credentials are not configured or ERPNext is unreachable, a robust
 * in-memory mock store provides instant demo readiness.
 */

const axios = require("axios");
const { ERP_URL, ERP_API_KEY, ERP_API_SECRET } = require("../config/env");

// ---------------------------------------------------------------------------
// In-memory mock store (used when live ERPNext credentials are dummy/offline)
// ---------------------------------------------------------------------------
const mockEmployees = [
  {
    name: "HR-EMP-00001",
    employee_name: "Sarah Connor",
    department: "Engineering",
    designation: "Principal Software Engineer",
    status: "Active",
  },
  {
    name: "HR-EMP-00002",
    employee_name: "Alex Johnson",
    department: "Product Design",
    designation: "Senior UI/UX Designer",
    status: "Active",
  },
  {
    name: "HR-EMP-00003",
    employee_name: "Elena Rostova",
    department: "Human Resources",
    designation: "HR Operations Lead",
    status: "Active",
  },
  {
    name: "HR-EMP-00004",
    employee_name: "Rajesh Patel",
    department: "Cloud Architecture",
    designation: "DevOps Engineer",
    status: "Active",
  },
  {
    name: "HR-EMP-00005",
    employee_name: "Marcus Vance",
    department: "Marketing",
    designation: "Content & Growth Specialist",
    status: "Active",
  },
  {
    name: "HR-EMP-00006",
    employee_name: "Chloe Zhao",
    department: "Finance & Legal",
    designation: "Financial Controller",
    status: "Active",
  },
  {
    name: "HR-EMP-00007",
    employee_name: "Liam O'Connor",
    department: "Customer Success",
    designation: "Client Support Manager",
    status: "Active",
  },
];

let mockLeaves = [
  {
    name: "HR-LAP-2026-0001",
    employee: "HR-EMP-00001",
    employee_name: "Sarah Connor",
    leave_type: "Privilege Leave",
    from_date: "2026-08-25",
    to_date: "2026-08-28",
    total_leave_days: 4,
    status: "Approved",
    reason: "Annual family vacation and rest.",
    creation: "2026-08-15 10:24:00",
  },
  {
    name: "HR-LAP-2026-0002",
    employee: "HR-EMP-00002",
    employee_name: "Alex Johnson",
    leave_type: "Casual Leave",
    from_date: "2026-08-20",
    to_date: "2026-08-21",
    total_leave_days: 2,
    status: "Open",
    reason: "Personal errands and apartment relocation.",
    creation: "2026-08-16 14:12:00",
  },
  {
    name: "HR-LAP-2026-0003",
    employee: "HR-EMP-00004",
    employee_name: "Rajesh Patel",
    leave_type: "Sick Leave",
    from_date: "2026-08-18",
    to_date: "2026-08-19",
    total_leave_days: 2,
    status: "Open",
    reason: "Severe fever and doctor advised bed rest.",
    creation: "2026-08-17 08:45:00",
  },
  {
    name: "HR-LAP-2026-0004",
    employee: "HR-EMP-00005",
    employee_name: "Marcus Vance",
    leave_type: "Compensatory Off",
    from_date: "2026-08-22",
    to_date: "2026-08-22",
    total_leave_days: 1,
    status: "Approved",
    reason: "Worked weekend for product marketing launch.",
    creation: "2026-08-14 16:30:00",
  },
  {
    name: "HR-LAP-2026-0005",
    employee: "HR-EMP-00006",
    employee_name: "Chloe Zhao",
    leave_type: "Privilege Leave",
    from_date: "2026-08-10",
    to_date: "2026-08-12",
    total_leave_days: 3,
    status: "Approved",
    reason: "Travel abroad for family reunion.",
    creation: "2026-08-01 09:15:00",
  },
  {
    name: "HR-LAP-2026-0006",
    employee: "HR-EMP-00007",
    employee_name: "Liam O'Connor",
    leave_type: "Casual Leave",
    from_date: "2026-08-05",
    to_date: "2026-08-05",
    total_leave_days: 1,
    status: "Rejected",
    reason: "Urgent personal appointment during audit window.",
    creation: "2026-08-03 11:20:00",
  },
];

const isMockMode =
  !ERP_API_KEY ||
  ERP_API_KEY === "replace_with_real_key" ||
  ERP_API_SECRET === "replace_with_real_secret";

// ---------------------------------------------------------------------------
// Axios instance – one client shared across all controllers
// ---------------------------------------------------------------------------
const erpClient = axios.create({
  baseURL: `${ERP_URL}/api/resource`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Authorization: `token ${ERP_API_KEY}:${ERP_API_SECRET}`,
  },
});

// ---------------------------------------------------------------------------
// Response interceptor
// ---------------------------------------------------------------------------
erpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const erpMessage =
      error.response?.data?.message ||
      error.response?.data?.exception ||
      error.message ||
      "ERPNext request failed";

    const status = error.response?.status || 500;
    const cleanError = new Error(erpMessage);
    cleanError.status = status;
    cleanError.erpnext = true;
    return Promise.reject(cleanError);
  }
);

// ---------------------------------------------------------------------------
// Helper – calculate day count
// ---------------------------------------------------------------------------
function calculateDays(fromDate, toDate) {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays || 1;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch a list of documents from ERPNext or fallback mock data.
 */
async function getList(doctype, params = {}) {
  if (isMockMode) {
    if (doctype === "Employee") {
      return [...mockEmployees];
    }
    if (doctype === "Leave Application") {
      return [...mockLeaves];
    }
    return [];
  }

  try {
    const response = await erpClient.get(`/${doctype}`, { params });
    return response.data.data;
  } catch (err) {
    console.warn(`[ERPNext Service] Live fetch for ${doctype} failed (${err.message}). Falling back to internal state.`);
    if (doctype === "Employee") return [...mockEmployees];
    if (doctype === "Leave Application") return [...mockLeaves];
    throw err;
  }
}

/**
 * Fetch a single document by name.
 */
async function getDoc(doctype, name) {
  if (isMockMode) {
    if (doctype === "Employee") {
      return mockEmployees.find((e) => e.name === name) || null;
    }
    if (doctype === "Leave Application") {
      return mockLeaves.find((l) => l.name === name) || null;
    }
    return null;
  }

  try {
    const response = await erpClient.get(`/${doctype}/${encodeURIComponent(name)}`);
    return response.data.data;
  } catch (err) {
    console.warn(`[ERPNext Service] Live getDoc failed (${err.message}). Falling back.`);
    if (doctype === "Employee") return mockEmployees.find((e) => e.name === name) || null;
    if (doctype === "Leave Application") return mockLeaves.find((l) => l.name === name) || null;
    throw err;
  }
}

/**
 * Create a new document in ERPNext or fallback mock data.
 */
async function createDoc(doc) {
  if (isMockMode) {
    if (doc.doctype === "Leave Application") {
      const emp = mockEmployees.find((e) => e.name === doc.employee);
      const days = calculateDays(doc.from_date, doc.to_date);
      const newLeave = {
        name: `HR-LAP-2026-${String(mockLeaves.length + 1).padStart(4, "0")}`,
        employee: doc.employee,
        employee_name: emp ? emp.employee_name : doc.employee,
        leave_type: doc.leave_type,
        from_date: doc.from_date,
        to_date: doc.to_date,
        total_leave_days: days,
        status: doc.status || "Open",
        reason: doc.reason,
        creation: new Date().toISOString().replace("T", " ").substring(0, 19),
      };
      mockLeaves.unshift(newLeave);
      return newLeave;
    }
    return doc;
  }

  try {
    const response = await erpClient.post(`/${doc.doctype}`, doc);
    return response.data.data;
  } catch (err) {
    console.warn(`[ERPNext Service] Live createDoc failed (${err.message}). Using local store.`);
    if (doc.doctype === "Leave Application") {
      const emp = mockEmployees.find((e) => e.name === doc.employee);
      const days = calculateDays(doc.from_date, doc.to_date);
      const newLeave = {
        name: `HR-LAP-2026-${String(mockLeaves.length + 1).padStart(4, "0")}`,
        employee: doc.employee,
        employee_name: emp ? emp.employee_name : doc.employee,
        leave_type: doc.leave_type,
        from_date: doc.from_date,
        to_date: doc.to_date,
        total_leave_days: days,
        status: doc.status || "Open",
        reason: doc.reason,
        creation: new Date().toISOString().replace("T", " ").substring(0, 19),
      };
      mockLeaves.unshift(newLeave);
      return newLeave;
    }
    throw err;
  }
}

module.exports = { erpClient, getList, getDoc, createDoc };
