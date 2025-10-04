import { signOutBtn } from "../assets/global/js/variables.js";
import { logOut } from "./logout.js";
signOutBtn.addEventListener("click", () => {
  logOut();
});
