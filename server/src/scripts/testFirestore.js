const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function test() {
  try {
    console.log("Checking Firestore...");
    const collections = await db.listCollections();
    console.log("Collections:", collections.map(c => c.id));
    console.log("Firestore connection SUCCESS!");
  } catch (error) {
    console.error("Firestore connection FAILED:", error);
  }
}

test();
