import { resetPasswordBtn } from "../assets/js/dom-variables.mjs";
import { resetPassword, verifyOobCode } from "./auth-functions.mjs";

window.addEventListener("DOMContentLoaded", verifyOobCode);
resetPasswordBtn.addEventListener("click", resetPassword);
