import { loadNamespace } from "../../../global/js/utils.mjs";
import { topSideBarMiddle } from "../../../global/js/variables.mjs";
import { setUpDatePicker } from "../../../shared/loader/js/utils.mjs";
import { initDomVariables, quizzesListContainer } from "./dom-variables.mjs";
import { handlePassedQuizCardBtns, initLazyLoadingLoader } from "./utils.mjs";

export const init = async () => {
  initDomVariables();
  await loadNamespace("quizzes");
  initLazyLoadingLoader();
  setUpDatePicker(topSideBarMiddle);
  quizzesListContainer?.addEventListener("click", handlePassedQuizCardBtns);
};
