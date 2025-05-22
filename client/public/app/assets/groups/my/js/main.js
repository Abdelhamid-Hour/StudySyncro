import { openOverlayModal } from '../../../global/js/utils.js';
import { initLazyLoadingLoader } from '../../../shared/groups-my-available/js/utils.js';
import { setUpSubjectSelectMenu, setUpSwitchBtn } from '../group-chat/js/utils.js';
import { groupCreateBtn, initDomVariables } from './dom-variables.js';
import { getGroupOverlay } from './utils.js';

export const init = () => {
  // Initialize DOM variables
  initDomVariables();
  const loader = initLazyLoadingLoader(true);
  groupCreateBtn.addEventListener('click', (e) => {
    openOverlayModal(
      ['.close-group-overlay'],
      getGroupOverlay,
      (backdropElement) => {
        setUpSubjectSelectMenu(
          backdropElement.querySelector('.group-subject-field'),
          'group-subject-select-menu'
        );
        const visibilityField = backdropElement.querySelector(
          '.group-visibility-field'
        );
        const levelField = backdropElement.querySelector(
          '.group-level-field'
        );
        setUpSwitchBtn(visibilityField);
        setUpSwitchBtn(levelField);
      }
    );
  });
};

init();
