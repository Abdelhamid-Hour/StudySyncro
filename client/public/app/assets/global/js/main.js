import {
  closeAndOpenLeftSideBar,
  handelIconsHover,
  handleNavigation,
  handleOverlayClick,
  handleOverlayClose,
  handleRoutingClick,
  openOverlayHandler,
  tooltipSetup,
  updateMain,
} from './utils.js';
import { closeLeftSideBarIcon } from './dom-variables.js';
import '../../../auth/auth.js';

tooltipSetup();

document.addEventListener('dragover', (e) => e.preventDefault());

closeLeftSideBarIcon.addEventListener('click', closeAndOpenLeftSideBar);

document.addEventListener('mouseover', (e) => handelIconsHover(e, true));

document.addEventListener('mouseout', (e) => handelIconsHover(e, false));

document.addEventListener('click', (e) => {
  openOverlayHandler(e);
  handleOverlayClick(e, ['drop-down-item', 'open-drop-down-btn']);
});

document.addEventListener('mousedown', handleOverlayClose);

document.addEventListener('click', handleRoutingClick, true);

document.addEventListener('click', handleNavigation);

window.addEventListener('popstate', () => {
  updateMain(location.pathname);
});
