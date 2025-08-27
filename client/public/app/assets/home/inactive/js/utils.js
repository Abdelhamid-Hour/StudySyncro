import {
  fetchData,
} from "../../../../../main_assets/js/utils.js";
import {
  openOverlayModal,
} from "../../../global/js/utils.js";
import { joinSession } from "../../../shared/session/js/utils.js";
import { handletTasksListners } from "../../../shared/tasks/js/utils.js";

export const handleSessionBtns = async (e) => {
  const sessionId = e.target
    .closest(".action-buttons")
    .getAttribute("data-session-id");
  const viewDetailsBtn = e.target.closest(".view-details");
  if (viewDetailsBtn) {
    openOverlayModal(
      "session-view-overlay",
      [".close-session-view-overlay"],
      async () => {
        const { overlay } = await fetchData("/session-details/" + sessionId);
        return overlay;
      },
      () => handletTasksListners("session-tasks")
    );
  }

  const joinBtn = e.target.closest(".join-session");
  if (joinBtn) {
    joinSession(sessionId, joinBtn);
  }
};

