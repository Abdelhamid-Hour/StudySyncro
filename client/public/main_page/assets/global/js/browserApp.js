import {
  closeAndOpenLeftSideBar,
  handelIconsHover,
  initActiveIcon,
  initCloseOverlayListner,
  openOverlay,
  tooltipSetup,
} from './domFunctions.js';
import { activeIcon, closeLeftSideBarIcon } from './getNodes.js';

tooltipSetup();
initActiveIcon(activeIcon);
closeLeftSideBarIcon.addEventListener('click', closeAndOpenLeftSideBar);
document.addEventListener('mouseover', handelIconsHover);
document.addEventListener('mouseout', handelIconsHover);
document.addEventListener('click', (e) =>
  openOverlay(e, [
    {
      buttonClassName: 'profile-btn',
      overlay: document.querySelector('.profile-btn + *'),
    },
    {
      buttonClassName: 'filter-button',
      overlay: document.querySelector('.filter-button + *'),
    },
  ])
);
initCloseOverlayListner(['profile-drop-down-menu', 'filter-panel'], {
  'profile-drop-down-menu': ['profile-container'],
  'filter-panel': ['filter-container'],
});
