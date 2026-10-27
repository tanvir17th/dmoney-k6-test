import http from 'k6/http';

const BASE_URL = 'https://dmoney.roadtocareer.net';
const SECRET_KEY = 'ROADTOSDET';

export function checkUserBalance(userPhone, token) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-AUTH-SECRET-KEY': SECRET_KEY,
    },
  };

  return http.get(`${BASE_URL}/user/balance/${userPhone}`, params);
}