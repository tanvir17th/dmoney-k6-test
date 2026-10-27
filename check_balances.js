import http from 'k6/http';

const BASE_URL = 'https://dmoney.roadtocareer.net';
const users = JSON.parse(open('./users.json'));

export const options = { vus: 1, iterations: 1 };

export default function () {
    const adminLogin = http.post(
        `${BASE_URL}/user/login`,
        JSON.stringify({ email: 'admin@dmoney.com', password: '1234' }),
        { headers: { 'Content-Type': 'application/json', 'X-AUTH-SECRET-KEY': 'ROADTOSDET' } }
    );
    const adminHeaders = {
        'Authorization': `Bearer ${adminLogin.json().token}`,
        'X-AUTH-SECRET-KEY': 'ROADTOSDET',
    };

    const ids = {
        agent1: 106023,
        agent2: 106024,
        customer1: 106025,
        customer2: 106026,
        merchant1: 106027,
    };

    for (const [name, id] of Object.entries(ids)) {
        const res = http.get(`${BASE_URL}/user/search/id/${id}`, { headers: adminHeaders });
        const u = res.json().user;
        console.log(`${name} (${u.phone_number}) Balance: ${u.balance}`);
    }
}