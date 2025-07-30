import { navigateTo } from '../../global/js/utils.js';
import {
  closeBtn,
  initDomVariables,
  nextBtn,
  prevBtn,
  skipBtn,
} from './dom-variables.js';
import {
  resetVars,
  setUpQuiz,
  skipQuestion,
  toNextQuestion,
  toPreviousQuestion,
} from './utils.js';

let firstLoad = true;
export const init = (virtual = false) => {
  if (virtual && firstLoad) {
    firstLoad = false; // Prevent re-initialization on subsequent calls
    return;
  }
  initDomVariables();

  resetVars();

  setUpQuiz();

  nextBtn.addEventListener('click', toNextQuestion);

  prevBtn.addEventListener('click', toPreviousQuestion);

  skipBtn.addEventListener('click', skipQuestion);

  closeBtn.addEventListener('click', () => {
    navigateTo('/home');
  });
};

init();
