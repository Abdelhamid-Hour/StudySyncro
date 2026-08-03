const admin = require("firebase-admin");
const { getStorage } = require("firebase-admin/storage");
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require("./firebaseConfig.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.firestore();
const rDb = admin.database();
const bucket = getStorage().bucket();

module.exports = { db, admin, bucket, rDb };
