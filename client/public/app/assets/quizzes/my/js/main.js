import { initLazyLoadingLoader } from '../../../shared/quizzes-my-groups/js/utils.js';
import { initDomVariables, quizCreateBtn } from './dom-variables.js';
import { handleQuizCreateClick } from './utils.js';

let firstLoad = true;

export const init = (virtual = false) => {
  if (virtual && firstLoad) {
    firstLoad = false; // Prevent re-initialization on subsequent calls
    return;
  }
  initDomVariables();

  const loader = initLazyLoadingLoader();
  console.log('Active Module start: my quizzes.js');
  quizCreateBtn.addEventListener('click', handleQuizCreateClick);
};

init();
