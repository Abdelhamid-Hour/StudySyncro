import { navigateTo } from '../../../global/js/utils.js';
import { initLazyLoadingLoader } from '../../../shared/groups-my-available/js/utils.js';
import { groupCreateBtn, initDomVariables } from './dom-variables.js';
import { handleGroupCreateClick } from './utils.js';

let firstLoad = true;

export const init = (virtual = false) => {
  if (virtual && firstLoad) {
    firstLoad = false; // Prevent re-initialization on subsequent calls
    return;
  }

  initDomVariables();

  const loader = initLazyLoadingLoader(true);

  console.log('Active Module start: my.js');
  groupCreateBtn.addEventListener('click', handleGroupCreateClick);
};

init();