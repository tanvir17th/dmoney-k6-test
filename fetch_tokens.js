const fs = require('fs');

const BASE_URL = 'https://dmoney.roadtocareer.net';
const users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));


const userIds = {
    agent1: 106023,
    agent2: 106024,
    customer1: 106025,
    customer2: 106026,
    merchant1: 106027,
    merchant2: 106028,
};

async function getAdminToken() {
    const res = await fetch(`${BASE_URL}/user/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-AUTH-SECRET-KEY': 'ROADTOSDET',
        },
        body: JSON.stringify({ email: 'admin@dmoney.com', password: '1234' }),
    });
    const data = await res.json();
    return data.token;
}

async function loginAndGetToken(key, user, adminToken) {

    const loginRes = await fetch(`${BASE_URL}/user/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-AUTH-SECRET-KEY': 'ROADTOSDET',
        },
        body: JSON.stringify({ email: user.email, password: user.password }),
    });

    const loginData = await loginRes.json();
    if (loginData.token) {
        return loginData.token;
    }


    const id = userIds[key];
    const searchRes = await fetch(`${BASE_URL}/user/search/id/${id}`, {
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'X-AUTH-SECRET-KEY': 'ROADTOSDET',
        },
    });

    const searchData = await searchRes.json();
    const otp = searchData.user?.otp || searchData.otp;

    if (!otp) {
        console.error(`[${key}] OTP not found in user object:`, searchData);
        return '';
    }


    const verifyRes = await fetch(`${BASE_URL}/user/otp/verify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-AUTH-SECRET-KEY': 'ROADTOSDET',
        },
        body: JSON.stringify({ phone_number: user.phone, otp: String(otp) }),
    });

    const verifyData = await verifyRes.json();
    return verifyData.token || '';
}

async function run() {
    console.log('Fetching Admin Token...');
    const adminToken = await getAdminToken();

    const tokens = {};
    for (const [key, user] of Object.entries(users)) {
        console.log(`Processing ${key} (${user.phone})...`);
        tokens[key] = await loginAndGetToken(key, user, adminToken);
        console.log(`${key}: ${tokens[key] ? 'Token Saved ✓' : 'Failed ✗'}`);
    }

    fs.writeFileSync('./tokens.json', JSON.stringify(tokens, null, 2));
    console.log('\n--- ALL TOKENS WRITTEN TO tokens.json ---');
}

run();