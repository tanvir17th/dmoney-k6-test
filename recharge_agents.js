import http from 'k6/http';

const BASE_URL = 'https://dmoney.roadtocareer.net';
const users = JSON.parse(open('./users.json'));

export const options = {
    vus: 1,
    iterations: 1,
};

export default function () {
    const sysLogin = http.post(
        `${BASE_URL}/user/login`,
        JSON.stringify({ email: 'system@dmoney.com', password: '1234' }),
        { headers: { 'Content-Type': 'application/json', 'X-AUTH-SECRET-KEY': 'ROADTOSDET' } }
    );

    const systemToken = sysLogin.json().token;
    const sysHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${systemToken}`,
        'X-AUTH-SECRET-KEY': 'ROADTOSDET',
    };

    for (const agent of [users.agent1, users.agent2]) {
        const res = http.post(
            `${BASE_URL}/transaction/deposit`,
            JSON.stringify({
                from_account: 'SYSTEM',
                to_account: agent.phone,
                amount: 50000,
            }),
            { headers: sysHeaders }
        );
        console.log(`Recharge ${agent.phone}: Status ${res.status}`);
    }
}