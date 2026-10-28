import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// Environment & Configuration Overrides
const BASE_URL = __ENV.BASE_URL || 'https://dmoney.roadtocareer.net';
const AUTH_SECRET_KEY = __ENV.AUTH_SECRET_KEY || 'ROADTOSDET';

// Load local configuration (Ensure tokens.json & users.json are added to .gitignore)
const users = JSON.parse(open('./users.json'));
const tokens = JSON.parse(open('./tokens.json'));

// Per-API Custom Metrics
const sendMoneySuccessRate = new Rate('sendmoney_success_rate');
const paymentSuccessRate = new Rate('payment_success_rate');
const depositSuccessRate = new Rate('deposit_success_rate');

const sendMoneyTrend = new Trend('sendmoney_response_time');
const paymentTrend = new Trend('payment_response_time');
const depositTrend = new Trend('deposit_response_time');

export const options = {
    scenarios: {
        // Concurrent Workload 1: Customer 1 Activities across all 4 phases
        customer1_worker: {
            executor: 'constant-vus',
            vus: 2,
            duration: '120s',
            exec: 'customer1Flow',
        },
        // Concurrent Workload 2: Customer 2 Activities across all 4 phases
        customer2_worker: {
            executor: 'constant-vus',
            vus: 2,
            duration: '120s',
            exec: 'customer2Flow',
        },
        // Concurrent Workload 3: Agent 1 Activities (Active from 30s to 120s)
        agent1_worker: {
            executor: 'constant-vus',
            vus: 2,
            duration: '90s',
            startTime: '30s',
            exec: 'agent1Flow',
        },
        // Concurrent Workload 4: Agent 2 Activities (Active from 60s to 120s)
        agent2_worker: {
            executor: 'constant-vus',
            vus: 2,
            duration: '60s',
            startTime: '60s',
            exec: 'agent2Flow',
        },
    },
    thresholds: {
        // Strict Assignment Requirements
        http_req_failed: ['rate<0.01'], // Less than 1% failure rate
        http_req_duration: ['p(95)<1000'], // Global P95 < 1000ms

        // Per-API Success Rate Thresholds (>= 99%)
        sendmoney_success_rate: ['rate>=0.99'],
        payment_success_rate: ['rate>=0.99'],
        deposit_success_rate: ['rate>=0.99'],

        // Per-API Latency Thresholds (P95 < 1000ms)
        sendmoney_response_time: ['p(95)<1000'],
        payment_response_time: ['p(95)<1000'],
        deposit_response_time: ['p(95)<1000'],
    },
};

/**
 * Enhanced Transaction Executor with Deep Payload Checks
 */
function executeTransaction(endpoint, senderPhone, receiverPhone, amount, token, metricRate, metricTrend, txnName) {
    const payload = JSON.stringify({
        from_account: senderPhone,
        to_account: receiverPhone,
        amount: amount,
    });

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-AUTH-SECRET-KEY': AUTH_SECRET_KEY,
    };

    const res = http.post(`${BASE_URL}${endpoint}`, payload, { headers });
    metricTrend.add(res.timings.duration);

    let jsonResp = {};
    try {
        jsonResp = res.json();
    } catch (e) {
        jsonResp = {};
    }

    // Check status code, presence of transaction ID, and success message pattern
    const isStatusValid = res.status === 200 || res.status === 201;
    const hasTrnxId = Boolean(jsonResp.trnxId || jsonResp.trnx_id || jsonResp.transactionId);
    const hasSuccessMsg = Boolean(
        jsonResp.message &&
        (jsonResp.message.toLowerCase().includes('successful') || jsonResp.message.toLowerCase().includes('success'))
    );

    const isSuccess = check(res, {
        [`${txnName} - Status 200/201`]: () => isStatusValid,
        [`${txnName} - Transaction ID returned`]: () => hasTrnxId,
        [`${txnName} - Expected success message`]: () => hasSuccessMsg,
    });

    metricRate.add(isSuccess);
    return res;
}

/**
 * Concurrent Worker Workloads
 */

// Customer 1 Activity Loop
export function customer1Flow() {
    // Send Money to Customer 2
    executeTransaction('/transaction/sendmoney', users.customer1.phone, users.customer2.phone, 10, tokens.customer1, sendMoneySuccessRate, sendMoneyTrend, 'SendMoney');
    sleep(1.5);

    // Payment to Merchant 1
    executeTransaction('/transaction/payment', users.customer1.phone, users.merchant1.phone, 10, tokens.customer1, paymentSuccessRate, paymentTrend, 'Payment');
    sleep(2);
}

// Customer 2 Activity Loop
export function customer2Flow() {
    // Payment to Merchant 1 / Merchant 2
    executeTransaction('/transaction/payment', users.customer2.phone, users.merchant1.phone, 10, tokens.customer2, paymentSuccessRate, paymentTrend, 'Payment');
    sleep(1.5);

    // Send Money to Customer 1
    executeTransaction('/transaction/sendmoney', users.customer2.phone, users.customer1.phone, 10, tokens.customer2, sendMoneySuccessRate, sendMoneyTrend, 'SendMoney');
    sleep(2);
}

// Agent 1 Activity Loop
export function agent1Flow() {
    // Deposit to Customer 1 / Customer 2
    executeTransaction('/transaction/deposit', users.agent1.phone, users.customer1.phone, 10, tokens.agent1, depositSuccessRate, depositTrend, 'Deposit');
    sleep(1.5);

    // Phase 4 Addition: Agent 1 Payment to Merchant 1
    executeTransaction('/transaction/payment', users.agent1.phone, users.merchant1.phone, 10, tokens.agent1, paymentSuccessRate, paymentTrend, 'Payment');
    sleep(2);
}

// Agent 2 Activity Loop
export function agent2Flow() {
    // Deposit to Customer 2
    executeTransaction('/transaction/deposit', users.agent2.phone, users.customer2.phone, 10, tokens.agent2, depositSuccessRate, depositTrend, 'Deposit');
    sleep(1.5);

    // Phase 4 Addition: Agent 2 Payment to Merchant 2
    executeTransaction('/transaction/payment', users.agent2.phone, users.merchant2.phone, 10, tokens.agent2, paymentSuccessRate, paymentTrend, 'Payment');
    sleep(2);
}

export function handleSummary(data) {
    return {
        'report.html': htmlReport(data),
    };
}