import { auth } from '../../firebase/firebaseConfig.js';
import { signOutBtn } from '../assets/js/getNodes.js';
import { logOut } from './logOut.js';

signOutBtn.addEventListener('click', () => {
    logOut('/session-logout');
})