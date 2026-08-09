import { handleApiAction, navigateTo, t } from "../../../global/js/utils.mjs";

export const endSession = (btn, sessionId, onSuccess) => {
  handleApiAction("/end-session", { sessionId }, btn, {
    onSuccess: () => {
      if (onSuccess) onSuccess();
      navigateTo("/home");
    },
  });
};

export const leaveSession = (btn, sessionId, onSuccess) => {
  handleApiAction("/leave-session", { sessionId }, btn, {
    onSuccess: () => {
      if (onSuccess) onSuccess();
      navigateTo("/home");
    },
    successMsg: t("common:alerts.left_session_success"),
  });
};

export const joinSession = async (sessionId, joinBtn) => {
  handleApiAction("/join-session", { sessionId }, joinBtn, {
    onSuccess: () => navigateTo("/home"),
    successMsg: t("common:alerts.joined_session_success"),
  });
};
