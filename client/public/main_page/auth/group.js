import { createGroupBtn } from "../assets/js/getNodes.js";
import { redirectTo } from "../../main_assets/js/domFunctions.js";
createGroupBtn.addEventListener("click", () => {
    console.log("clicked")
    redirectTo("/Groupe");
});
