import http from 'k6/http';

const users = JSON.parse(open('./users.json'));
const tokens = JSON.parse(open('./tokens.json'));
const BASE_URL = 'https://dmoney.roadtocareer.net';

export default function () {

    const smRes = http.post(
        `${BASE_URL}/transaction/sendmoney`,
        JSON.stringify({
            from_account: users.customer1.phone,
            to_account: users.customer2.phone,
            amount: 10,
        }),
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokens.customer1}`,
                'X-AUTH-SECRET-KEY': 'ROADTOSDET',
            },
        }
    );
    console.log('--- Send Money Status ---');
    console.log('Status:', smRes.status);
    console.log('Body:', smRes.body);


    const payRes = http.post(
        `${BASE_URL}/transaction/payment`,
        JSON.stringify({
            from_account: users.customer2.phone,
            to_account: users.merchant1.phone,
            amount: 10,
        }),
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokens.customer2}`,
                'X-AUTH-SECRET-KEY': 'ROADTOSDET',
            },
        }
    );
    console.log('--- Payment Status ---');
    console.log('Status:', payRes.status);
    console.log('Body:', payRes.body);


    const depRes = http.post(
        `${BASE_URL}/transaction/deposit`,
        JSON.stringify({
            from_account: users.agent1.phone,
            to_account: users.customer1.phone,
            amount: 10,
        }),
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokens.agent1}`,
                'X-AUTH-SECRET-KEY': 'ROADTOSDET',
            },
        }
    );
    console.log('--- Deposit Status ---');
    console.log('Status:', depRes.status);
    console.log('Body:', depRes.body);
}