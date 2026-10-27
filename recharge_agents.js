import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = 'https://dmoney.roadtocareer.net';
const SECRET_KEY = 'ROADTOSDET';

export function depositBalance(fromAccount, toAccount, amount, token) {
  const payload = JSON.stringify({
    from_account: fromAccount,
    to_account: toAccount,
    amount: amount,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-AUTH-SECRET-KEY': SECRET_KEY,
    },
  };

  const res = http.post(`${BASE_URL}/transaction/deposit`, payload, params);
  
  check(res, {
    'Deposit success': (r) => r.status === 200 || r.status === 201,
  });

  return res;
}