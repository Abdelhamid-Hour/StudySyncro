import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js';
import { getAuth, setPersistence, inMemoryPersistence } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDNKyuI_J1Sq63nZyPx-5cblj9-L4--3rU',
  authDomain: 'leaning-11c1d.firebaseapp.com',
  databaseURL: 'https://leaning-11c1d-default-rtdb.firebaseio.com',
  projectId: 'leaning-11c1d',
  storageBucket: 'leaning-11c1d.firebasestorage.app',
  messagingSenderId: '944790274402',
  appId: '1:944790274402:web:53f3c23ae766ced5c0ec3b',
  measurementId: 'G-9JSW8ECX6T',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

(async function setAuthPersistence() {
  try {
    await setPersistence(auth, inMemoryPersistence);
    console.log('Auth persistence set');
  } catch (error) {
    console.log(error);
  }
})();
export { auth };

