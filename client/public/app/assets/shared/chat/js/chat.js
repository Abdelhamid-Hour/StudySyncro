import {
  getDatabase,
  ref,
  set,
  onChildAdded,
  push,
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { app } from '../../../../../firebase/firebaseConfig';

const db = getDatabase(app);
const reference = ref(db, 'messages/${');
