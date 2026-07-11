import { initLazyLoadingLoader } from '../../../shared/groups-my-available/js/utils.js';
import { JoinGroupButtonHandler } from './utils.js';

export const init = (virtual = false) => {
  const lazyLoadingLoader = initLazyLoadingLoader(false);
  document.addEventListener('click', JoinGroupButtonHandler);
};

init();
