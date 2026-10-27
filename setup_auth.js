import http from 'k6/http';

const BASE_URL = 'https://dmoney.roadtocareer.net';
const users = JSON.parse(open('./users.json'));

export const options = {
    vus: 1,
    iterations: 1,
};


const userMeta = {
    agent1: { id: 106023 },
    agent2: { id: 106024 },
    customer1: { id: 106025 },
    customer2: { id: 106026 },
    merchant1: { id: 106027 },
    merchant2: { id: 106028 },
};

export default function () {
    console.log('--- 1. Admin Login ---');
    const adminLogin = http.post(
        `${BASE_URL}/user/login`,
        JSON.stringify({ email: 'admin@dmoney.com', password: '1234' }),
        { headers: { 'Content-Type': 'application/json', 'X-AUTH-SECRET-KEY': 'ROADTOSDET' } }
    );
    const adminToken = adminLogin.json().token;
    const adminHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'X-AUTH-SECRET-KEY': 'ROADTOSDET',
    };

    const tokens = {};

    console.log('--- 2. Logging in and verifying OTP for all 6 users ---');
    for (const [key, userObj] of Object.entries(users)) {
     
        http.post(
            `${BASE_URL}/user/login`,
            JSON.stringify({ email: userObj.email, password: userObj.password }),
            { headers: { 'Content-Type': 'application/json', 'X-AUTH-SECRET-KEY': 'ROADTOSDET' } }
        );

       
        const uId = userMeta[key].id;
        const searchRes = http.get(`${BASE_URL}/user/search/id/${uId}`, { headers: adminHeaders });
        const otp = searchRes.json().user.otp;
        console.log(`Fetched live OTP for ${key}: ${otp}`);

       
        const verifyRes = http.post(
            `${BASE_URL}/user/verify-otp`,
            JSON.stringify({ identifier: userObj.email, otp: otp }),
            { headers: { 'Content-Type': 'application/json', 'X-AUTH-SECRET-KEY': 'ROADTOSDET' } }
        );

        const vJson = verifyRes.json();
        const token = vJson.token || (vJson.data && vJson.data.token);
        tokens[key] = token;
        console.log(`✓ ${key} Bearer Token Acquired!`);
    }

    console.log('--- 3. Agent Depositing to Customers ---');
    const agent1Headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.agent1}`,
        'X-AUTH-SECRET-KEY': 'ROADTOSDET',
    };


    const dep1 = http.post(
        `${BASE_URL}/transaction/deposit`,
        JSON.stringify({
            from_account: users.agent1.phone,
            to_account: users.customer1.phone,
            amount: 1000,
        }),
        { headers: agent1Headers }
    );
    console.log('Agent 1 -> Customer 1 Deposit:', dep1.status, dep1.body);


    const dep2 = http.post(
        `${BASE_URL}/transaction/deposit`,
        JSON.stringify({
            from_account: users.agent1.phone,
            to_account: users.customer2.phone,
            amount: 1000,
        }),
        { headers: agent1Headers }
    );
    console.log('Agent 1 -> Customer 2 Deposit:', dep2.status, dep2.body);

    console.log('\n=======================================');
    console.log('ALL TOKENS READY FOR LOAD TEST:');
    console.log('=======================================');
    console.log(JSON.stringify(tokens, null, 2));
    console.log('=======================================');
}