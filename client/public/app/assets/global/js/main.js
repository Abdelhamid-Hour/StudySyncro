import {
  closeAndOpenLeftSideBar,
  handelIconsHover,
  handleNavigation,
  initActiveIcon,
  initCloseOverlayListner,
  openOverlay,
  tooltipSetup,
  updateMain,
} from './utils.js';
import { activeIcon, closeLeftSideBarIcon } from './dom-variables.js';
import '../../../auth/auth.js';

tooltipSetup();

initActiveIcon(activeIcon);

document.addEventListener('dragover', (e) => e.preventDefault());

closeLeftSideBarIcon.addEventListener('click', closeAndOpenLeftSideBar);

document.addEventListener('mouseover', (e) => handelIconsHover(e, true));

document.addEventListener('mouseout', (e) => handelIconsHover(e, false));

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
    {
      buttonClassName: 'open-select-btn',
      overlay: document.querySelector(
        '.group-subject-select-menu'
      ),
    },
    {
      buttonClassName: 'group-chat-menu-btn',
      overlay: document.querySelector('.group-chat-menu-btn-drop-down-menu'),
    },
    {
      buttonClassName: 'emoji-button',
      overlay: document.querySelector('.emoji-button + *'),
    },
  ])
);

initCloseOverlayListner(
  [
    'profile-drop-down-menu',
    'filter-panel',
    'group-subject-select-menu',
    'emoji-list',
    'group-chat-menu-btn-drop-down-menu',
  ],
  {
    'profile-drop-down-menu': ['profile-btn'],
    'filter-panel': ['filter-container'],
    'group-subject-select-menu': [
      'open-select-btn',
      'select-search',
      'other-subject-input',
    ],
    'emoji-list': ['emoji-picker'],
    'group-chat-menu-btn-drop-down-menu': ['group-chat-menu-btn'],
  }
);

document.addEventListener('click', (e) => {
  handleNavigation(e, [
    '.side-bar-icons a',
    '.navigation-tabs a',
    '.profile-container a',
    'a.group-card',
  ]);
});

window.addEventListener('popstate', () => {
  updateMain(location.pathname);
});
