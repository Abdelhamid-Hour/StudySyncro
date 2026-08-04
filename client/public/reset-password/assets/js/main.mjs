import {
  handlEyeIconsClick,
  initI18n,
  initThemeToggleBtn,
} from "../../../main_assets/js/utils.mjs";
import "../../auth/auth.mjs";
import { eyeIcons, toggleBtn } from "./dom-variables.mjs";

await initI18n(["shared"]);

handlEyeIconsClick(eyeIcons);

initThemeToggleBtn(toggleBtn);
