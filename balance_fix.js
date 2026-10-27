import http from 'k6/http';

const users = JSON.parse(open('./users.json'));
const tokens = JSON.parse(open('./tokens.json'));
const BASE_URL = 'https://dmoney.roadtocareer.net';

export const options = { vus: 1, iterations: 1 };

export default function () {
  
    const res1 = http.post(
        `${BASE_URL}/transaction/sendmoney`,
        JSON.stringify({
            from_account: users.customer1.phone,
            to_account: users.customer2.phone,
            amount: 4000,
        }),
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokens.customer1}`,
                'X-AUTH-SECRET-KEY': 'ROADTOSDET',
            },
        }
    );
    console.log('Balance Adjustment 1:', res1.status, res1.body);
}