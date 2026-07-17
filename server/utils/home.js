const { getMessages, getRecentMessagesHelper } = require("./firebase-utils/chat");
const {
  getCurrentSessionInfo,
  getSessionInformations,
  fetchActiveSessions,
} = require("./firebase-utils/session");
const {
  formatHoursMinutes,
  formatTimeAgo,
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
        hasActiveSession: true
      },
    };
  }

  const result = await fetchActiveSessions(userId);
  const messagesResult = await getRecentMessagesHelper(userId);

  return {
    pathName: pathNames.home.inactive,
    payload: {
      templateContext: {
        availableSessions: result.sessions,
        recentMessages: messagesResult.success ? messagesResult.data.cards : [],
        lastVisible: messagesResult.success ? messagesResult.data.lastVisible : null,
        formatTimeAgo,
      },
    },
  };
};

module.exports = {
  fetchHomeData,
  getSessionDetails,
};
