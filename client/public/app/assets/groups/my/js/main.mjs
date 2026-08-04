import { loadNamespace } from "../../../global/js/utils.mjs";
import { initLazyLoadingLoader } from "../../../shared/groups-my-available/js/utils.mjs";
import { initDomVariables } from "./dom-variables.mjs";
import { handleGroupCreateClick } from "./utils.mjs";

export const init = async () => {
  initDomVariables();
  await loadNamespace("groups");

  const loader = initLazyLoadingLoader(true);

  document.querySelectorAll(".create-group-btn").forEach((btn) => {
    btn.addEventListener("click", handleGroupCreateClick);
  });
};

init();
