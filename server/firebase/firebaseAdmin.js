const admin = require('firebase-admin');
const serviceAccount = require('./firebaseConfig.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://leaning-11c1d-default-rtdb.firebaseio.com',
});
const db = admin.firestore();
module.exports = { db, admin };
