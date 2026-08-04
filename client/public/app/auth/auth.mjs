import { signOutBtn } from "../assets/global/js/variables.mjs";
import { logOut } from "./logout.mjs";
signOutBtn.addEventListener("click", () => {
  logOut();
});
