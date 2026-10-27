import http from 'k6/http';

const BASE_URL = 'https://dmoney.roadtocareer.net';
const users = JSON.parse(open('./users.json'));
const tokens = JSON.parse(open('./tokens.json'));

export const options = { vus: 1, iterations: 1 };

export default function () {
    const agentHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.agent1}`,
        'X-AUTH-SECRET-KEY': 'ROADTOSDET',
    };

    for (const cust of [users.customer1, users.customer2]) {
        const res = http.post(
            `${BASE_URL}/transaction/deposit`,
            JSON.stringify({
                from_account: users.agent1.phone,
                to_account: cust.phone,
                amount: 2000,
            }),
            { headers: agentHeaders }
        );
        console.log(`Recharged ${cust.phone}: Status ${res.status} -> ${res.body}`);
    }
}