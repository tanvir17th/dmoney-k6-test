import http from 'k6/http';

const BASE_URL = 'https://dmoney.roadtocareer.net';
const users = JSON.parse(open('./users.json'));

export const options = { vus: 1, iterations: 1 };

export default function () {
    const tokens = {};
    const headers = {
        'Content-Type': 'application/json',
        'X-AUTH-SECRET-KEY': 'ROADTOSDET',
    };

    for (const [role, cred] of Object.entries(users)) {
        const res = http.post(
            `${BASE_URL}/user/login`,
            JSON.stringify({ email: cred.email, password: cred.password }),
            { headers }
        );
        const body = res.json();
        tokens[role] = body.token || (body.data && body.data.token) || '';
        console.log(`Token fetched for ${role}: Status ${res.status}`);
    }

    console.log('--- COPY THE JSON BELOW INTO tokens.json ---');
    console.log(JSON.stringify(tokens, null, 2));
}