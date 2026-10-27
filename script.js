import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { fetchTokens } from './fetch_tokens.js';

const BASE_URL = 'https://dmoney.roadtocareer.net';
const SECRET_KEY = 'ROADTOSDET';

// Load User Credentials from root users.json
const USERS = JSON.parse(open('./users.json'));

// Performance Metrics
const depositDuration = new Trend('deposit_response_time');
const sendMoneyDuration = new Trend('sendmoney_response_time');
const paymentDuration = new Trend('payment_response_time');

const depositFailRate = new Rate('deposit_fail_rate');
const sendMoneyFailRate = new Rate('sendmoney_fail_rate');
const paymentFailRate = new Rate('payment_fail_rate');

const transactionChecksRate = new Rate('transaction_checks');

export const options = {
  scenarios: {
    dmoney_workload: {
      executor: 'constant-vus',
      vus: 10,
      duration: '120s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
    transaction_checks: ['rate>0.99'],

    deposit_response_time: ['p(95)<1000'],
    deposit_fail_rate: ['rate<0.01'],

    sendmoney_response_time: ['p(95)<1000'],
    sendmoney_fail_rate: ['rate<0.01'],

    payment_response_time: ['p(95)<1000'],
    payment_fail_rate: ['rate<0.01'],
  },
};

export function setup() {
  const tokens = fetchTokens(USERS);
  return { tokens };
}

export default function (data) {
  const elapsed = (__VU * 2 + __ITER) % 120;
  const tokens = data.tokens;

  function getHeaders(userKey) {
    return {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': tokens[userKey] ? `Bearer ${tokens[userKey]}` : '',
        'X-AUTH-SECRET-KEY': SECRET_KEY,
      },
    };
  }

  function safeJsonParse(res) {
    try {
      return res.json();
    } catch (e) {
      return null;
    }
  }

  function executeTransaction(endpoint, fromUser, toUser, amount, trendMetric, failRateMetric) {
    const url = `${BASE_URL}/transaction/${endpoint}`;
    const payload = JSON.stringify({
      from_account: USERS[fromUser].phone,
      to_account: USERS[toUser].phone,
      amount: amount,
    });

    const res = http.post(url, payload, getHeaders(fromUser));

    trendMetric.add(res.timings.duration);
    const body = safeJsonParse(res);

    const isSuccess = check(res, {
      'Status Code is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'Transaction is successful': () => {
        return body !== null && (
          (body.message && body.message.toLowerCase().includes('success')) ||
          res.status === 200 || res.status === 201
        );
      },
      'Transaction ID is returned': () => {
        return body !== null && (
          body.trnxId !== undefined ||
          (body.transaction && body.transaction.id !== undefined)
        );
      },
      'Expected success message present': () => {
        return body !== null && body.message !== undefined;
      },
    });

    transactionChecksRate.add(isSuccess);
    failRateMetric.add(!isSuccess);
  }

  // Time Progression Matrix
  if (elapsed >= 0 && elapsed < 30) {
    // 0–30s
    executeTransaction('sendmoney', 'customer1', 'customer2', 50, sendMoneyDuration, sendMoneyFailRate);
    executeTransaction('payment', 'customer2', 'merchant1', 20, paymentDuration, paymentFailRate);
  } else if (elapsed >= 30 && elapsed < 60) {
    // 30–60s
    executeTransaction('sendmoney', 'customer2', 'customer1', 30, sendMoneyDuration, sendMoneyFailRate);
    executeTransaction('deposit', 'agent1', 'customer2', 200, depositDuration, depositFailRate);
    executeTransaction('payment', 'customer1', 'merchant1', 15, paymentDuration, paymentFailRate);
  } else if (elapsed >= 60 && elapsed < 90) {
    // 60–90s
    executeTransaction('deposit', 'agent1', 'customer1', 300, depositDuration, depositFailRate);
    executeTransaction('deposit', 'agent2', 'customer2', 250, depositDuration, depositFailRate);
    executeTransaction('sendmoney', 'customer1', 'customer2', 40, sendMoneyDuration, sendMoneyFailRate);
    executeTransaction('payment', 'customer2', 'merchant2', 25, paymentDuration, paymentFailRate);
  } else if (elapsed >= 90 && elapsed <= 120) {
    // 90–120s
    executeTransaction('payment', 'agent1', 'merchant1', 100, paymentDuration, paymentFailRate);
    executeTransaction('payment', 'agent2', 'merchant2', 150, paymentDuration, paymentFailRate);
    executeTransaction('payment', 'customer1', 'merchant1', 10, paymentDuration, paymentFailRate);
    executeTransaction('payment', 'customer2', 'merchant2', 12, paymentDuration, paymentFailRate);
  }

  sleep(1);
}