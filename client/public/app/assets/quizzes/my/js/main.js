import {
  initDomVariables,
  quizCreateBtn,
  quizzesListContainer,
} from "./dom-variables.js";
import { handleQuizCardBtns, handleQuizCreateClick, initLazyLoadingLoader } from "./utils.js";

export const init = (virtual = false) => {
  initDomVariables();

  const loader = initLazyLoadingLoader();
  quizCreateBtn?.addEventListener("click", handleQuizCreateClick);
  quizzesListContainer?.addEventListener("click", handleQuizCardBtns);
};

init();
