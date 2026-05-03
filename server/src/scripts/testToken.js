const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function test() {
  const credential = admin.credential.cert(serviceAccount);
  const token = await credential.getAccessToken();
  console.log("Token:", token.access_token.substring(0, 20) + "...");
  
  // Let's decode the JWT!
  const jwtPayload = serviceAccount.client_email + ' uses a JWT. The iat is probably wrong.';
  console.log("Current Node UTC time:", new Date().toISOString());
  console.log("Current Node Unix time:", Math.floor(Date.now() / 1000));
}

test();
