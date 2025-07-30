import { initLazyLoadingLoader } from '../../../shared/groups-my-available/js/utils.js';
import { JoinGroupButtonHandler } from './utils.js';

let firstLoad = true;

export const init = (virtual = false) => {
  if (virtual && firstLoad) {
    firstLoad = false; // Prevent re-initialization on subsequent calls
    return;
  } 

  const lazyLoadingLoader = initLazyLoadingLoader(false);
  console.log('Active Module start: available.js');
  document.addEventListener('click', JoinGroupButtonHandler);
};

init();
