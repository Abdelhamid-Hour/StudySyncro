import { initDomVariables, quizCreateBtn } from "./dom-variables.js";
import { handleQuizCreateClick } from "./utils.js";


export const init = () => {
  initDomVariables();

//   const loader = initLazyLoadingLoader();

  quizCreateBtn.addEventListener('click', handleQuizCreateClick);
};

init();
