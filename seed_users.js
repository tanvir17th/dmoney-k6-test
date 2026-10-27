import http from 'k6/http';

const BASE_URL = 'https://dmoney.roadtocareer.net';

export const options = {
    vus: 1,
    iterations: 1,
};

export default function () {
    console.log('--- 1. Logging in as Admin (admin@dmoney.com) ---');
    const adminLoginRes = http.post(
        `${BASE_URL}/user/login`,
        JSON.stringify({
            email: 'admin@dmoney.com',
            password: '1234',
        }),
        {
            headers: {
                'Content-Type': 'application/json',
                'X-AUTH-SECRET-KEY': 'ROADTOSDET',
            },
        }
    );

    let adminToken = '';
    try {
        const body = adminLoginRes.json();
        adminToken = body.token || (body.data && body.data.token) || '';
    } catch (e) { }

    if (!adminToken) {
        console.error('Admin Login Failed!');
        return;
    }
    console.log('✓ Admin Logged In Successfully!');

    const adminHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'X-AUTH-SECRET-KEY': 'ROADTOSDET',
    };

    
    const randomSuffix = Math.floor(1000000 + Math.random() * 9000000).toString();
    const password = 'Password@123';

    const userConfigs = [
        { role: 'Agent', key: 'agent1', name: 'Agent One', phone: `0171${randomSuffix}` },
        { role: 'Agent', key: 'agent2', name: 'Agent Two', phone: `0172${randomSuffix}` },
        { role: 'Customer', key: 'customer1', name: 'Customer One', phone: `0181${randomSuffix}` },
        { role: 'Customer', key: 'customer2', name: 'Customer Two', phone: `0182${randomSuffix}` },
        { role: 'Merchant', key: 'merchant1', name: 'Merchant One', phone: `0191${randomSuffix}` },
        { role: 'Merchant', key: 'merchant2', name: 'Merchant Two', phone: `0192${randomSuffix}` },
    ];

    const generatedUsers = {};

    console.log('--- 2. Creating 6 Users ---');
    for (const u of userConfigs) {
        const email = `${u.key}_${randomSuffix}@gmail.com`;
        const createPayload = JSON.stringify({
            name: u.name,
            email: email,
            password: password,
            phone_number: u.phone,
            nid: `199${randomSuffix.slice(0, 6)}12`,
            role: u.role,
        });

        const createRes = http.post(`${BASE_URL}/user/create`, createPayload, {
            headers: adminHeaders,
        });

        console.log(`Created ${u.role} (${u.key}) [${u.phone}]: Status ${createRes.status}`);
        if (createRes.status !== 200 && createRes.status !== 201) {
            console.log(`Error Response: ${createRes.body}`);
        }

        generatedUsers[u.key] = {
            email: email,
            password: password,
            phone: u.phone,
        };
    }

    console.log('--- 3. Logging in as System (system@dmoney.com) ---');
    const sysLoginRes = http.post(
        `${BASE_URL}/user/login`,
        JSON.stringify({
            email: 'system@dmoney.com',
            password: '1234',
        }),
        {
            headers: {
                'Content-Type': 'application/json',
                'X-AUTH-SECRET-KEY': 'ROADTOSDET',
            },
        }
    );

    let systemToken = '';
    try {
        const sysBody = sysLoginRes.json();
        systemToken = sysBody.token || (sysBody.data && sysBody.data.token) || '';
    } catch (e) { }

    const sysHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${systemToken}`,
        'X-AUTH-SECRET-KEY': 'ROADTOSDET',
    };

    console.log('--- 4. Depositing Initial Balance ---');
    for (const agentKey of ['agent1', 'agent2']) {
        const agentPhone = generatedUsers[agentKey].phone;
        const depRes = http.post(
            `${BASE_URL}/transaction/deposit`,
            JSON.stringify({
                from_account: 'SYSTEM',
                to_account: agentPhone,
                amount: 25000,
            }),
            { headers: sysHeaders }
        );
        console.log(`Deposit to ${agentKey} (${agentPhone}): Status ${depRes.status}`);
    }

    for (const custKey of ['customer1', 'customer2']) {
        const custPhone = generatedUsers[custKey].phone;
        const depRes = http.post(
            `${BASE_URL}/transaction/deposit`,
            JSON.stringify({
                from_account: 'SYSTEM',
                to_account: custPhone,
                amount: 15000,
            }),
            { headers: sysHeaders }
        );
        console.log(`Deposit to ${custKey} (${custPhone}): Status ${depRes.status}`);
    }

    console.log('\n=======================================');
    console.log('COPY THIS JSON INTO users.json:');
    console.log('=======================================');
    console.log(JSON.stringify(generatedUsers, null, 2));
    console.log('=======================================');
}