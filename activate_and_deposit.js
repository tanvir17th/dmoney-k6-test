import http from 'k6/http';

const BASE_URL = 'https://dmoney.roadtocareer.net';

export const options = {
    vus: 1,
    iterations: 1,
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

    console.log('--- 2. Fetching User Details by ID (106023) ---');
   
    const res1 = http.get(`${BASE_URL}/user/search/id/106023`, { headers: adminHeaders });
    console.log('Response /user/search/id/106023:', res1.status, res1.body);

 
    const res2 = http.get(`${BASE_URL}/user/search?phone_number=01717464816`, { headers: adminHeaders });
    console.log('Response /user/search?phone_number=...:', res2.status, res2.body);
}