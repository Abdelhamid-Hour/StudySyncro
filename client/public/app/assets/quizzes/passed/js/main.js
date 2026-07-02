import { topSideBarMiddle } from "../../../global/js/variables.js";
import { setUpDatePicker } from "../../../shared/loader/js/utils.js";
import { initDomVariables, quizzesListContainer } from "./dom-variables.js";
import { initLazyLoadingLoader, handlePassedQuizCardBtns } from "./utils.js";

export const init = (virtual = false) => {
  initDomVariables();

  const loader = initLazyLoadingLoader();
  setUpDatePicker(topSideBarMiddle);
  quizzesListContainer?.addEventListener("click", handlePassedQuizCardBtns);
};

init();
