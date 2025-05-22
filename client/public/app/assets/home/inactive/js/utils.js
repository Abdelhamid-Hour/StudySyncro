import {
  fetchData,
  showMessageBlock,
} from '../../../../../main_assets/js/utils.js';
import { openOverlayModal } from '../../../global/js/utils.js';
import { handletTasksListners } from '../../../shared/tasks/js/utils.js';

export const handleSessionDetailsBtn = async (e) => {
  const viewDetailsBtn = e.target.closest('.view-details');
  if (viewDetailsBtn) {
    openOverlayModal(
      ['.close-session-overlay'],
      async () => {
        const sessionId = viewDetailsBtn.getAttribute('data-session-id');
        const { overlay } = await fetchData('/session-details/' + sessionId);
        return overlay;
      },
      () => handletTasksListners()
    );
  }
};
