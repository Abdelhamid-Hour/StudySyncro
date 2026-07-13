import { handleApiAction, navigateTo } from "../../../global/js/utils.js";

export const endSession = (btn, sessionId) => {
  handleApiAction("/end-session", { sessionId }, btn);
};

export const leaveSession = (btn, sessionId) => {
  handleApiAction("/leave-session", { sessionId }, btn, {
    onSuccess: () => navigateTo("/home"),
    successMsg: "You have left the session successfully.",
  });
};

export const joinSession = async (sessionId, joinBtn) => {
  handleApiAction("/join-session", { sessionId }, joinBtn, {
    onSuccess: () => navigateTo("/home"),
    successMsg: "You Are Joined The Session Successfully",
  });
};
