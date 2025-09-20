import { signOutBtn } from '../assets/global/js/dom-variables.js';
import { logOut } from './logout.js';
signOutBtn.addEventListener('click', () => {
  logOut();
});
