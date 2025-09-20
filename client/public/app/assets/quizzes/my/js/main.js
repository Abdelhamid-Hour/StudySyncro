import {
  initDomVariables,
  quizCreateBtn,
  quizzesListContainer,
} from "./dom-variables.js";
import { handleQuizCardBtns, handleQuizCreateClick, initLazyLoadingLoader } from "./utils.js";

let firstLoad = true;

export const init = (virtual = false) => {
  if (virtual && firstLoad) {
    firstLoad = false; // Prevent re-initialization on subsequent calls
    return;
  }
  initDomVariables();

  const loader = initLazyLoadingLoader();
  quizCreateBtn.addEventListener("click", handleQuizCreateClick);
  quizzesListContainer.addEventListener("click", handleQuizCardBtns);
};

init();
