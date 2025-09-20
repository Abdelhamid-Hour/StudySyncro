import { topSideBarMiddle } from "../../../global/js/dom-variables.js";
import { setUpDatePicker } from "../../../shared/quizzes-groups/js/utils.js";
import { initDomVariables, quizzesListContainer } from "./dom-variables.js";
import { initLazyLoadingLoader, handlePassedQuizCardBtns } from "./utils.js";

let firstLoad = true;

export const init = (virtual = false) => {
  if (virtual && firstLoad) {
    firstLoad = false; // Prevent re-initialization on subsequent calls
    return;
  }
  initDomVariables();

  const loader = initLazyLoadingLoader();
  setUpDatePicker(topSideBarMiddle);
  quizzesListContainer.addEventListener("click", handlePassedQuizCardBtns);
};

init();
