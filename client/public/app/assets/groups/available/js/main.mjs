import {
  loadNamespace,
  registerPageListener,
} from "../../../global/js/utils.mjs";
import { initLazyLoadingLoader } from "../../../shared/groups-my-available/js/utils.mjs";
import { JoinGroupButtonHandler } from "./utils.mjs";

export const init = async () => {
  await loadNamespace("groups");
  initLazyLoadingLoader(false);
  registerPageListener(document, "click", JoinGroupButtonHandler);
};
