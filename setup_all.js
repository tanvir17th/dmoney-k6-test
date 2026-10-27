import http from 'k6/http';

const BASE_URL = 'https://dmoney.roadtocareer.net';
const users = JSON.parse(open('./users.json'));

export const options = { vus: 1, iterations: 1 };

export default function () {
    console.log('--- Step 1: System Login & Funding ---');
    const sysLogin = http.post(
        `${BASE_URL}/user/login`,
        JSON.stringify({ email: 'system@dmoney.com', password: '1234' }),
        { headers: { 'Content-Type': 'application/json' } }
    );
    const sysToken = sysLogin.json().token;
    const sysHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sysToken}`,
        'X-AUTH-SECRET-KEY': 'ROADTOSDET',
    };

  
    for (const agent of [users.agent1, users.agent2]) {
        const res = http.post(
            `${BASE_URL}/transaction/deposit`,
            JSON.stringify({ from_account: 'SYSTEM', to_account: agent.phone, amount: 20000 }),
            { headers: sysHeaders }
        );
        console.log(`Funded Agent ${agent.phone}: Status ${res.status}`);
    }

  
    for (const cust of [users.customer1, users.customer2]) {
        const res = http.post(
            `${BASE_URL}/transaction/deposit`,
            JSON.stringify({ from_account: 'SYSTEM', to_account: cust.phone, amount: 2000 }),
            { headers: sysHeaders }
        );
        console.log(`Funded Customer ${cust.phone}: Status ${res.status}`);
    }

    console.log('--- Setup Done! ---');
}