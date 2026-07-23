import { handleApiAction, navigateTo, t } from "../../../global/js/utils.js";

export const endSession = (btn, sessionId) => {
  handleApiAction("/end-session", { sessionId }, btn);
};

export const leaveSession = (btn, sessionId) => {
  handleApiAction("/leave-session", { sessionId }, btn, {
    onSuccess: () => navigateTo("/home"),
    successMsg: t("common:alerts.left_session_success"),
  });
};

export const joinSession = async (sessionId, joinBtn) => {
  handleApiAction("/join-session", { sessionId }, joinBtn, {
    onSuccess: () => navigateTo("/home"),
    successMsg: t("common:alerts.joined_session_success"),
  });
};
