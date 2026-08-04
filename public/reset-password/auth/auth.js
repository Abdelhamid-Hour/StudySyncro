import { resetPasswordBtn } from '../assets/js/dom-variables.js';
import { resetPassword, verifyOobCode } from './auth-functions.js';

window.addEventListener('DOMContentLoaded', verifyOobCode);
resetPasswordBtn.addEventListener('click', resetPassword);
