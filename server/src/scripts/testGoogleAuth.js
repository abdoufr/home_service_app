const { JWT } = require('google-auth-library');
const keys = require('../../serviceAccountKey.json');

async function main() {
  const client = new JWT({
    email: keys.client_email,
    key: keys.private_key,
    scopes: ['https://www.googleapis.com/auth/datastore'],
  });
  
  try {
    const res = await client.authorize();
    console.log("Success!", res.access_token.substring(0, 10));
  } catch (err) {
    console.error(err.message);
  }
}

main();
