import { navigateTo } from '../../../global/js/utils.js';
import { initLazyLoadingLoader } from '../../../shared/groups-my-available/js/utils.js';
import { groupCreateBtn, initDomVariables } from './dom-variables.js';
import { handleGroupCreateClick } from './utils.js';

export const init = (virtual = false) => {
  initDomVariables();

  const loader = initLazyLoadingLoader(true);

  console.log('Active Module start: my.js');
  groupCreateBtn?.addEventListener('click', handleGroupCreateClick);
};

init();