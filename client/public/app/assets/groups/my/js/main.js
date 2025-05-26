import { initLazyLoadingLoader } from '../../../shared/groups-my-available/js/utils.js';
import { groupCreateBtn, initDomVariables } from './dom-variables.js';
import { handleGroupCreateClick } from './utils.js';

export const init = () => {
  document
    .querySelector('.create-group-btn')
    .addEventListener('click', (e) => {});
  // Initialize DOM variables
  initDomVariables();
  const loader = initLazyLoadingLoader(true);
  groupCreateBtn.addEventListener('click', handleGroupCreateClick);
};

init();
