import { handleApiAction, navigateTo, t } from "../../../global/js/utils.mjs";

export const endSession = (btn, sessionId, onSuccess) => {
  handleApiAction(
    "/end-session",
    { sessionId },
    btn,
    onSuccess ? { onSuccess } : undefined,
  );
};

export const leaveSession = (
  btn,
  sessionId,
  onSuccess = () => navigateTo(route),
) => {
  handleApiAction("/leave-session", { sessionId }, btn, {
    onSuccess,
    successMsg: t("common:alerts.left_session_success"),
  });
};

export const joinSession = async (sessionId, joinBtn) => {
  handleApiAction("/join-session", { sessionId }, joinBtn, {
    onSuccess: () => navigateTo("/home"),
    successMsg: t("common:alerts.joined_session_success"),
  });
};
