import { loadNamespace } from "../../../global/js/utils.js";
import { topSideBarMiddle } from "../../../global/js/variables.js";
import { setUpDatePicker } from "../../../shared/loader/js/utils.js";
import { initDomVariables, quizzesListContainer } from "./dom-variables.js";
import { handlePassedQuizCardBtns, initLazyLoadingLoader } from "./utils.js";

export const init = async () => {
  initDomVariables();
  await loadNamespace("quizzes");

  const loader = initLazyLoadingLoader();
  setUpDatePicker(topSideBarMiddle);
  quizzesListContainer?.addEventListener("click", handlePassedQuizCardBtns);
};

init();
