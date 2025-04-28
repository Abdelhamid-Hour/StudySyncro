import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js';
import { getAuth, setPersistence, inMemoryPersistence } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyBQD23tZrfSimPKW8sFIzC_1MoNFGZ9e7A",
  authDomain: "studyhype-653c2.firebaseapp.com",
  projectId: "studyhype-653c2",
  storageBucket: "studyhype-653c2.firebasestorage.app",
  messagingSenderId: "342899099971",
  appId: "1:342899099971:web:b9f9d34740f542e7fe07f6",
  measurementId: "G-6GLNXG0TTP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

(async function setAuthPersistence() {
    await setPersistence(auth, inMemoryPersistence);
    console.log('Auth persistence set');
})();
export { auth };

