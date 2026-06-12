const http = require('http');
const https = require('https');

async function test() {
  const payload = JSON.stringify({
    usernameOrEmail: "testuser1",
    password: "testpass123"
  });

  const options = {
    hostname: 'goldtraderpro-production.up.railway.app',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => console.log('Login:', data));
  });

  req.write(payload);
  req.end();
}

test();
