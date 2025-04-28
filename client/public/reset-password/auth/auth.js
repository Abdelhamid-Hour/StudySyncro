import { resetPasswordBtn } from '../assets/js/variables.js';
import {
  verifyOobCode,
  resetPassword,
} from './authFunctions.js';

window.addEventListener('DOMContentLoaded', verifyOobCode);
resetPasswordBtn.addEventListener('click', resetPassword);
