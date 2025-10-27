const { getMessages } = require("./firebase-utils/chat");
const { getJoinedGroups } = require("./firebase-utils/group");
const {
  getCurrentSessionInfo,
  getSessionInformations,
  fetchActiveSessions,
} = require("./firebase-utils/session");
const {
  Task,
  Quiz,
  formatHoursMinutes,
  millisecondsToHMFormat,
  pathNames,
} = require("./global");

const getTimeLeft = (durationInMins, endTime) => {
  const now = new Date().getTime();
  const remainingTime = endTime - now;
  const timeLeft =
    remainingTime > 0
      ? durationInMins * 60 * 1000 - remainingTime
      : -(remainingTime - this.durationInMins * 60 * 1000);
  return timeLeft;
};

const getSessionDetails = async (sessionId) => {
  const result = await getSessionInformations(sessionId);
  return result;
};

const fetchHomeData = async (userId) => {
  const session = await getCurrentSessionInfo(userId); // or null

  if (session) {
    const result = await getMessages(session.id, session.groupId, userId);
    return {
      pathName: pathNames.home.active,
      payload: {
        templateContext: {
          session,
          messages: result.success ? result.messages : [],
          lastVisible: result.success ? result.lastVisible : null,
          formatHoursMinutes,
        },
      },
    };
  }

  const result = await fetchActiveSessions(userId);

  return {
    pathName: pathNames.home.inactive,
    payload: { templateContext: { availableSessions: result.sessions } },
  };
};

module.exports = {
  fetchHomeData,
  getSessionDetails,
};
