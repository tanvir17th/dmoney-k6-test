<div align="center">

# dMoney API Load & Performance Testing Framework

## 📌 Executive Summary
This project delivers a comprehensive performance and load testing suite for the **dMoney** REST API platform using **Grafana k6**. The performance suite evaluates system throughput, response latency, and threshold compliance under concurrent multi-role traffic flows (Customer, Agent, and Merchant) spanning 120 seconds across 4 distinct execution windows.

![k6](https://img.shields.io/badge/k6-load%20testing-7D64FF?style=for-the-badge&logo=k6&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-utilities-339933?style=for-the-badge&logo=node.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Latest Report](https://img.shields.io/badge/Latest%20Report-0%20thresholds%20breached-brightgreen?style=for-the-badge)

</div>


---

## 🛠 Project Fixes & Feedback Compliance

All issues identified during review have been refactored in `script.js` and repository configurations:

1. **Complete Phase 4 Workload Coverage:** `agent1Flow` and `agent2Flow` execute Agent 1 → Merchant 1 and Agent 2 → Merchant 2 payment transactions during the 90–120 second window alongside Customer transfers.
2. **Concurrent Workload Architecture:** Replaced sequential monolithic phase scripts with four independent, concurrent scenario workers (`customer1_worker`, `customer2_worker`, `agent1_worker`, `agent2_worker`).
3. **Deep Payload Assertion:** `executeTransaction()` validates HTTP status codes (`200`/`201`), presence of a valid transaction ID (`trnxId` / `trnx_id` / `transactionId`), and success message content.
4. **Strict Assignment Thresholds & Per-API SLAs:**
   * Global HTTP failure rate threshold enforced at `<1%` (`http_req_failed < 0.01`).
   * Individual per-API success rates enforced at `≥99%` for Deposit, Payment, and SendMoney.
   * Individual P(95) response time thresholds enforced at `<1000ms` per API.
5. **Credential Security & Environment Decoupling:** Hardcoded auth headers and sensitive tokens were removed. Environment variables (`__ENV.AUTH_SECRET_KEY`, `__ENV.BASE_URL`) handle runtime parameters, while local secret files (`users.json`, `tokens.json`) are excluded via `.gitignore`.
6. **Embedded Visual Evidence:** Screenshots are committed locally within `./screenshots/` and embedded directly in this document.

---

## 🏗 Architecture & Load Profile

The workload models continuous concurrent traffic across 4 scenario workers over a 120-second timeline:

| Scenario Worker | Target Role / Action | Active Window | Virtual Users (VUs) | Execution Function |
| :--- | :--- | :--- | :--- | :--- |
| `customer1_worker` | SendMoney to Customer 2 & Payment to Merchant 1 | 0s – 120s | 2 VUs | `customer1Flow()` |
| `customer2_worker` | Payment to Merchant 1 & SendMoney to Customer 1 | 0s – 120s | 2 VUs | `customer2Flow()` |
| `agent1_worker` | Deposit to Customer 1 & Payment to Merchant 1 | 30s – 120s | 2 VUs | `agent1Flow()` |
| `agent2_worker` | Deposit to Customer 2 & Payment to Merchant 2 | 60s – 120s | 2 VUs | `agent2Flow()` |

---

## 📊 Comprehensive API Performance & Latency Comparison

The load test generated **344 total HTTP requests** (172 full iteration loops) under max 8 concurrent VUs:

### 1. Latency & Response Time Comparison

| API Endpoint | Min Latency | Median (P50) | Average | P(90) | P(95) Threshold Target | P(95) Actual | Max Latency | SLA Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Deposit** (`/transaction/deposit`) | 238.79 ms | 322.96 ms | 331.49 ms | 412.25 ms | `< 1000 ms` | **421.94 ms** | 473.06 ms | **PASSED** |
| **Payment** (`/transaction/payment`) | 155.96 ms | 200.13 ms | 213.78 ms | 272.11 ms | `< 1000 ms` | **300.78 ms** | 461.99 ms | **PASSED** |
| **Send Money** (`/transaction/sendmoney`) | 159.92 ms | 201.93 ms | 213.90 ms | 265.23 ms | `< 1000 ms` | **326.44 ms** | 430.77 ms | **PASSED** |
| **Overall HTTP Duration** | 155.96 ms | 206.46 ms | 230.25 ms | 330.24 ms | `< 1000 ms` | **366.63 ms** | 473.06 ms | **PASSED** |

### 2. Rate, Throughput & Failure Analysis

| Metric Name | Target SLA | Actual Rate % | Passed Count | Failed Count | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `http_req_failed` | `< 1.00%` | **0.29%** | 343 | 1 | **PASSED** |
| `deposit_success_rate` | `≥ 99.00%` | **100.00%** | 48 | 0 | **PASSED** |
| `payment_success_rate` | `≥ 99.00%` | **99.42%** | 171 | 1 | **PASSED** |
| `sendmoney_success_rate` | `≥ 99.00%` | **100.00%** | 124 | 0 | **PASSED** |

---

## 📈 Per-API Performance Degradation & Workload Analysis

1. **Deposit API Analysis:**
   * **Behavior:** Exhibited the highest average response time (331.49 ms) and P(95) latency (421.94 ms).
   * **Degradation:** Latency increased by ~90 ms when Agent 2 joined Agent 1 during the 60s–120s window. However, success rate remained 100% with zero failed deposits.

2. **Payment API Analysis:**
   * **Behavior:** Handled the highest total transaction throughput (172 requests). Maintain an average response time of 213.78 ms.
   * **Degradation:** Showed minimal degradation across VU scaling, maintaining a P(95) latency of 300.78 ms. A single transient 403 network failure occurred out of 172 requests, maintaining a 99.42% success rate (well within the ≥99% SLA limit).

3. **Send Money API Analysis:**
   * **Behavior:** Delivered consistent latencies with a median of 201.93 ms and P(95) of 326.44 ms.
   * **Degradation:** Response time remained stable as VUs increased from 4 to 8, demonstrating predictable concurrency scaling.

---

## 🖼 Verification Screenshots


### Load Test Execution Summary
![k6 Terminal Summary](./docs/screenshots/k6_terminal_summary.png)

### HTML Test Report
![k6 HTML Report Overview](./docs/screenshots/k6_html_report.png)
![k6 HTML Per-API Metrics](./docs/screenshots/k6_html_metrics.png)
![k6 HTML Per-API Metrics](./docs/screenshots/k6_html_metrics2.png)
---

## 🚀 Execution Instructions

### Prerequisites
* Grafana k6 CLI installed (`brew install k6`)
* Node.js v16+ (optional for authentication helpers)

### Running the Test Suite

1. **Recharge System & Agent Accounts:**
   ```bash
   k6 run recharge_agents.js
   ```

2. **Generate Fresh Auth Tokens:**
   ```bash
   k6 run setup_auth.js
   ```

3. ## Author

**Md. Tanvir Ahamed**

---

<div align="center">

DMoney API performance test suite

</div>