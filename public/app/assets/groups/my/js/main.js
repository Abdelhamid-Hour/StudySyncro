import { loadNamespace } from "../../../global/js/utils.js";
import { initLazyLoadingLoader } from "../../../shared/groups-my-available/js/utils.js";
import { initDomVariables } from "./dom-variables.js";
import { handleGroupCreateClick } from "./utils.js";

export const init = async () => {
  initDomVariables();
  await loadNamespace("groups");

  const loader = initLazyLoadingLoader(true);

  document.querySelectorAll(".create-group-btn").forEach((btn) => {
    btn.addEventListener("click", handleGroupCreateClick);
  });
};

init();
