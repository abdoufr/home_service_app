const admin = require('firebase-admin');
const https = require('https');

// Load service account
const serviceAccount = require('../../serviceAccountKey.json');

// Initialize Firebase Admin just to get credentials
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function createFirestoreDatabase() {
  console.log('🔥 Creating Firestore Database for project:', serviceAccount.project_id);
  
  // Get access token from the service account
  const credential = admin.credential.cert(serviceAccount);
  const token = await credential.getAccessToken();
  const accessToken = token.access_token;
  
  console.log('✅ Got access token');

  const projectId = serviceAccount.project_id;
  const location = 'europe-west1'; // Belgium - closest to Algeria

  // Create Firestore database via REST API
  const requestBody = JSON.stringify({
    locationId: location,
    type: 'FIRESTORE_NATIVE',
  });

  const options = {
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${projectId}/databases?databaseId=(default)`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const response = JSON.parse(data);
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('🎉 Firestore database created successfully!');
          console.log('   Region:', location);
          console.log('   Project:', projectId);
          resolve(response);
        } else if (res.statusCode === 409) {
          console.log('ℹ️  Firestore database already exists!');
          resolve(response);
        } else {
          console.error('❌ Error creating Firestore:', JSON.stringify(response, null, 2));
          reject(new Error(response.error?.message || 'Unknown error'));
        }
      });
    });
    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}

createFirestoreDatabase()
  .then(() => {
    console.log('\n✅ Done! You can now run: npm run seed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  });
