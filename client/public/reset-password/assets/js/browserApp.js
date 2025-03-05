import { handlEyeIconsClick, handlResetPassword } from "../../../main_assets/js/domFunctions.js";
import { eyeIcons, resetPasswordBtn } from "./variables.js";

handlEyeIconsClick(eyeIcons);

resetPasswordBtn.addEventListener("click", handlResetPassword);