import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

const users = JSON.parse(open('./users.json'));
const tokens = JSON.parse(open('./tokens.json'));
const BASE_URL = 'https://dmoney.roadtocareer.net';

// Custom Metrics
const sendMoneySuccessRate = new Rate('sendmoney_success_rate');
const paymentSuccessRate = new Rate('payment_success_rate');
const depositSuccessRate = new Rate('deposit_success_rate');

const sendMoneyTrend = new Trend('sendmoney_response_time');
const paymentTrend = new Trend('payment_response_time');
const depositTrend = new Trend('deposit_response_time');

export const options = {
    scenarios: {
        // 0–30s
        flow_0_30: {
            executor: 'constant-vus',
            vus: 2,
            duration: '30s',
            exec: 'phase1',
        },
        // 30–60s
        flow_30_60: {
            executor: 'constant-vus',
            vus: 3,
            duration: '30s',
            startTime: '30s',
            exec: 'phase2',
        },
        // 60–90s
        flow_60_90: {
            executor: 'constant-vus',
            vus: 4,
            duration: '30s',
            startTime: '60s',
            exec: 'phase3',
        },
        // 90–120s
        flow_90_120: {
            executor: 'constant-vus',
            vus: 4,
            duration: '30s',
            startTime: '90s',
            exec: 'phase4',
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.10'],
        http_req_duration: ['p(95)<1000'],
        sendmoney_success_rate: ['rate>=0.70'],
        payment_success_rate: ['rate>=0.70'],
        deposit_success_rate: ['rate>=0.70'],
    },
};

// Generic Transaction Executor
function executeTransaction(endpoint, senderPhone, receiverPhone, amount, token, metricRate, metricTrend, txnName) {
    const payload = JSON.stringify({
        from_account: senderPhone,
        to_account: receiverPhone,
        amount: amount,
    });

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-AUTH-SECRET-KEY': 'ROADTOSDET',
    };

    const res = http.post(`${BASE_URL}${endpoint}`, payload, { headers });
    metricTrend.add(res.timings.duration);

    let json = {};
    try {
        json = res.json();
    } catch (e) { }

    const isSuccess = check(res, {
        [`${txnName} status is valid`]: (r) => r.status === 200 || r.status === 201,
    });

    metricRate.add(isSuccess);
    return res;
}

// 0–30 seconds
// - Customer 1 sends money to Customer 2
// - Customer 2 makes payments to Merchant 1
export function phase1() {
    executeTransaction('/transaction/sendmoney', users.customer1.phone, users.customer2.phone, 10, tokens.customer1, sendMoneySuccessRate, sendMoneyTrend, 'SendMoney');
    sleep(1.5);
    executeTransaction('/transaction/payment', users.customer2.phone, users.merchant1.phone, 10, tokens.customer2, paymentSuccessRate, paymentTrend, 'Payment');
    sleep(2);
}

// 30–60 seconds
// - Customer 2 sends money to Customer 1
// - Agent 1 deposits money to Customer 2
// - Customer 1 makes payments to Merchant 1
export function phase2() {
    executeTransaction('/transaction/deposit', users.agent1.phone, users.customer2.phone, 50, tokens.agent1, depositSuccessRate, depositTrend, 'Deposit');
    sleep(1);
    executeTransaction('/transaction/sendmoney', users.customer2.phone, users.customer1.phone, 10, tokens.customer2, sendMoneySuccessRate, sendMoneyTrend, 'SendMoney');
    sleep(1.5);
    executeTransaction('/transaction/payment', users.customer1.phone, users.merchant1.phone, 10, tokens.customer1, paymentSuccessRate, paymentTrend, 'Payment');
    sleep(2);
}

// 60–90 seconds
// - Agent 1 deposits money to Customer 1
// - Agent 2 deposits money to Customer 2
// - Customer 1 sends money to Customer 2
// - Customer 2 makes payments to Merchant 2
export function phase3() {
    executeTransaction('/transaction/deposit', users.agent1.phone, users.customer1.phone, 50, tokens.agent1, depositSuccessRate, depositTrend, 'Deposit');
    sleep(1);
    executeTransaction('/transaction/deposit', users.agent2.phone, users.customer2.phone, 50, tokens.agent2, depositSuccessRate, depositTrend, 'Deposit');
    sleep(1);
    executeTransaction('/transaction/sendmoney', users.customer1.phone, users.customer2.phone, 10, tokens.customer1, sendMoneySuccessRate, sendMoneyTrend, 'SendMoney');
    sleep(1.5);
    executeTransaction('/transaction/payment', users.customer2.phone, users.merchant2.phone, 10, tokens.customer2, paymentSuccessRate, paymentTrend, 'Payment');
    sleep(2);
}

// 90–120 seconds
// - Customer 1 makes payments to Merchant 1
// - Customer 2 makes payments to Merchant 2
export function phase4() {
    executeTransaction('/transaction/payment', users.customer1.phone, users.merchant1.phone, 10, tokens.customer1, paymentSuccessRate, paymentTrend, 'Payment');
    sleep(1.5);
    executeTransaction('/transaction/payment', users.customer2.phone, users.merchant2.phone, 10, tokens.customer2, paymentSuccessRate, paymentTrend, 'Payment');
    sleep(2);
}

export function handleSummary(data) {
    return {
        'report.html': htmlReport(data),
    };
}