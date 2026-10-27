import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = 'https://dmoney.roadtocareer.net';
const SECRET_KEY = 'ROADTOSDET';

export function fetchTokens(users) {
  const tokens = {};

  for (const [key, user] of Object.entries(users)) {
    const payload = JSON.stringify({
      phone_number: user.phone,
      password: user.password,
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
        'X-AUTH-SECRET-KEY': SECRET_KEY,
      },
    };

    const res = http.post(`${BASE_URL}/user/login`, payload, params);

    check(res, {
      [`${key} login status 200`]: (r) => r.status === 200,
    });

    if (res.status === 200) {
      try {
        const body = res.json();
        tokens[key] = body.token || (body.data && body.data.token);
      } catch (e) {
        console.error(`Token parse error for ${key}`);
      }
    }
  }

  return tokens;
}