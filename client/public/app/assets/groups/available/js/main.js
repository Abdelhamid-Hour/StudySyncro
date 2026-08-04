import { loadNamespace, registerPageListener } from '../../../global/js/utils.js';
import { initLazyLoadingLoader } from '../../../shared/groups-my-available/js/utils.js';
import { JoinGroupButtonHandler } from './utils.js';

export const init = async () => {
  await loadNamespace("groups");
  const lazyLoadingLoader = initLazyLoadingLoader(false);
  registerPageListener(document, 'click', JoinGroupButtonHandler);
};

init();
