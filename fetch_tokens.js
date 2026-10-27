import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = 'https://dmoney.roadtocareer.net';
const SECRET_KEY = 'ROADTOSDET';

export function fetchTokens(users) {
  const tokens = {};
  const otpRequests = [];

  for (const [key, user] of Object.entries(users)) {
    const userEnvKey = key.toUpperCase();
    const phone = __ENV[`DMONEY_PHONE_${userEnvKey}`] || user.phone;
    const password = __ENV[`DMONEY_PASSWORD_${userEnvKey}`] || user.password;
    const params = {
      headers: {
        'Content-Type': 'application/json',
        'X-AUTH-SECRET-KEY': SECRET_KEY,
      },
    };

    const otpEnvName = `DMONEY_OTP_${key.toUpperCase()}`;
    const otp = __ENV[otpEnvName];
    let body;
    if (otp) {
      const verifyPayload = JSON.stringify({ identifier: phone, otp });
      const verifyRes = http.post(`${BASE_URL}/user/verify-otp`, verifyPayload, params);

      const verificationSucceeded = check(verifyRes, {
        [`${key} OTP verification status 200`]: (r) => r.status === 200,
      });
      if (!verificationSucceeded) {
        throw new Error(`OTP verification failed for ${key}: HTTP ${verifyRes.status}; response: ${verifyRes.body.slice(0, 200)}`);
      }

      try {
        body = verifyRes.json();
      } catch (e) {
        throw new Error(`OTP verification response for ${key} was not valid JSON`);
      }
    } else {
      const payload = JSON.stringify({ email: phone, password });
      const loginRes = http.post(`${BASE_URL}/user/login`, payload, params);

      const loginSucceeded = check(loginRes, {
        [`${key} login status 200`]: (r) => r.status === 200,
      });
      if (!loginSucceeded) {
        const passwordEnvName = `DMONEY_PASSWORD_${userEnvKey}`;
        throw new Error(`Login failed for ${key}: HTTP ${loginRes.status}; response: ${loginRes.body.slice(0, 200)}. Verify the account password or set ${passwordEnvName}.`);
      }

      try {
        body = loginRes.json();
      } catch (e) {
        throw new Error(`Login response for ${key} was not valid JSON`);
      }

      if (body.otpRequired || (body.data && body.data.otpRequired)) {
        otpRequests.push(otpEnvName);
        continue;
      }
    }

    const token = body.token || (body.data && body.data.token);
    if (!token) {
      throw new Error(`Authentication response for ${key} did not contain an auth token`);
    }

    tokens[key] = token;
  }

  if (otpRequests.length > 0) {
    throw new Error(`OTP codes were requested for all accounts. Set these variables to the received codes, then rerun: ${otpRequests.join(', ')}`);
  }

  return tokens;
}