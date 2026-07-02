const { getMessages } = require("./firebase-utils/chat");
const {
  getCurrentSessionInfo,
  getSessionInformations,
  fetchActiveSessions,
} = require("./firebase-utils/session");
const {
  formatHoursMinutes,
  pathNames,
} = require("./global");

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
