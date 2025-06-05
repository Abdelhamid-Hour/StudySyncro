import { resetPasswordBtn } from '../assets/js/dom-variables.js';
import { verifyOobCode, resetPassword } from './auth-functions.js';

window.addEventListener('DOMContentLoaded', verifyOobCode);
resetPasswordBtn.addEventListener('click', resetPassword);
