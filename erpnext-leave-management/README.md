# RecoverAI — Autonomous AI Revenue Recovery Agent

> **Turn failed payments into recovered revenue.**  
> A dual-target hackathon project for the **Razorpay AI Buildathon** (AI Revenue Recovery track) and the **Exasol AI + Data Challenge 2026**.

---

## 🌟 Overview

Payment failures in online checkouts cost merchants billions in lost GMV annually due to transient bank network timeouts, insufficient funds, expired cards, and checkout abandonments.

**RecoverAI** is an autonomous revenue recovery engine that intercepts payment failure signals, performs predictive risk & probability modeling via Exasol columnar analytics, and executes intelligent automated interventions (Smart Dynamic Retries, Tokenized Payment Links, Customer Notifications) via Razorpay.

### Dual Hackathon Alignment

| Hackathon | Core Focus & Innovation |
|---|---|
| **Razorpay AI Buildathon** | Intercepts Razorpay payment failure webhooks, evaluates failure codes, executes automated zero-friction retries or tokenized UPI payment recovery links. |
| **Exasol AI + Data Challenge 2026** | Uses Exasol Personal as an in-memory columnar database to process high-velocity payment telemetry, perform ML recovery scoring, and power Natural Language to SQL analytics. |

---

## 🚀 Key Features

1. **Revenue Recovery Command Center (Dashboard)**
   - Real-time KPIs: Revenue at Risk, Recovered Revenue, Recovery Rate %, Active Recovery Cases.
   - Failure signal distribution breakdown & telemetry monitoring.

2. **Payments Telemetry Repository**
   - Full repository of synthetic & live Indian payment transactions (UPI, Cards, NetBanking, Wallets).
   - Filtering by status (`FAILED`, `RECOVERED`, `SUCCESS`, `ABANDONED`) and payment method.
   - Built-in payment simulation to test failure scenarios.

3. **Autonomous Recovery Agent**
   - Multi-step visual decision pipeline:
     1. Ingestion of Payment Telemetry
     2. ML Probability & Health Scoring
     3. Strategy & Circuit Breaker Evaluation (safety guard stops after >= 3 attempts)
     4. Intervention Execution & Cryptographic Audit Dispatch
   - Deterministic heuristic rule engine with optional LLM enrichment.

4. **Exasol Personal AI Data Analytics**
   - Natural Language to SQL query interface.
   - Pre-mapped optimized queries for Exasol columnar performance.
   - Live query execution timing and tabular result viewer.

5. **Immutable Audit Trail**
   - Cryptographically timestamped audit log of every action taken by the agent or received via webhooks.

6. **Full Demo Mode (Zero Credentials Required)**
   - Fully operational out-of-the-box with 75 realistic Indian payment telemetry records.
   - Seamlessly connects to real Razorpay and Exasol Personal instances when credentials are supplied.

---

## 🛠️ Architecture

```
RecoverAI
├── Frontend (React 18 + Vite + Modern Dark Fintech CSS)
│   ├── Dashboard (KPIs, Charts, Failure Analysis)
│   ├── Payments (Searchable Telemetry Table, Simulator)
│   ├── Recovery Agent (4-Step Visual AI Decision Pipeline)
│   ├── Exasol AI Analytics (NL → SQL Query Engine)
│   ├── Audit Trail (Immutable Event Log)
│   └── Architecture & Settings (Telemetry & Connectivity)
└── Backend (Express.js + Node.js)
    ├── /api/payments     ← Razorpay Orders & Verification
    ├── /api/recovery     ← AI Decision Engine & Intervention Execution
    ├── /api/analytics    ← Exasol Personal Named Queries & NL Mapping
    └── /api/audit        ← Immutable Audit Event Logger
```

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js 18+
- npm

### 2. Installation
Clone the repository and install all dependencies:
```bash
npm run install:all
```

### 3. Running Locally
Start both backend API (`localhost:5000`) and Vite UI (`localhost:5173`) concurrently:
```bash
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## ⚙️ Configuration (.env)

The application works out of the box in **Demo Mode**. To connect live services, create or update `server/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Demo Mode (true for simulated sandbox, false for live)
DEMO_MODE=true
PAYMENT_MODE=demo

# Razorpay Credentials (Optional for Demo)
RAZORPAY_KEY_ID=rzp_test_xxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx

# Exasol Personal Credentials (Optional for Demo)
EXASOL_HOST=localhost
EXASOL_PORT=8563
EXASOL_USER=sys
EXASOL_PASSWORD=exasol
EXASOL_DATABASE=RECOVERAI

# Optional AI Key for LLM Enrichment
AI_API_KEY=
```

---

## 📊 Exasol Database Schema

The Exasol schema and named analytics queries are located in `server/sql/`:
- `server/sql/schema.sql`: Table definitions for `PAYMENTS`, `RECOVERY_CASES`, and `AUDIT_LOGS`.
- `server/sql/analytics.sql`: Pre-built analytical queries for recovery rates, failure reasons, and action performance.

---

## 🏆 Hackathon Submission Checklist

- [x] **100% ERPNext / Frappe Code Removed**
- [x] **Razorpay AI Buildathon Requirements**: Webhook receiver, order creation, smart retry routing, recovery links.
- [x] **Exasol AI + Data Challenge Requirements**: Columnar schema, SQL analytics, NL to SQL query engine.
- [x] **Autonomous AI Agent**: Heuristic decision engine, circuit breaker fatigue protection, multi-step visualization.
- [x] **Production UI**: Responsive dark-mode fintech interface with instant live telemetry.
