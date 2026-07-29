// const { get } = require("../routes/api-routes");
const { db } = require("../firebase/firebaseAdmin");
const {
  getRequests,
  getDemandesByGroupId,
} = require("./firebase-utils/demandes");
const {
  getUserQuizzes,
  getQuizzesByGroupId,
} = require("./firebase-utils/examen");
const { getGroupInfo, getChatContext } = require("./firebase-utils/group");
const { getMembers } = require("./firebase-utils/members");
const { getSessionInformations } = require("./firebase-utils/session");
const { millisecondsToHMFormat } = require("./global");
const GroupFragmentRoutes = [
  { route: "/group-info", title: "common:shared_terms.group_info" },
  {
    route: "/session-info",
    title: "common:shared_terms.session_info",
  },
  { route: "/members-list", title: "common:shared_terms.members" },
  {
    route: "/demandes-list",
    title: "common:shared_terms.join_requests",
  },
  { route: "/quizzes-list", title: "common:titles.quizzes" },
];

const getGroupChatContext = async (userId, groupId) => {
  return await getChatContext(userId, groupId);
};
// Group Left Side Bar Contexts
const getGroupInfoContext = async (groupId, user) => {
  const groupInfo = await getGroupInfo(groupId, user.uid);
  return groupInfo;
};

const getSessionInfoContext = async (groupId, userId) => {
  const groupSnap = await db.collection("groups").doc(groupId).get();
  const groupData = groupSnap.data();

  if (!groupSnap.exists)
    return {
      success: false,
      message: "api:group_not_found_1",
      isNative: true,
      type: "info",
    };

  const res = await getSessionInformations(groupData.currentSession);

  if (!res.success) {
    return {
      success: false,
      message: res.message || "api:failed_to_load_session_info",
      isNative: res.isNative,
      type: res.type,
    };
  }

  return {
    success: true,
    context: {
      ...res.session,
      count: res.session.joinedCount,
      isAdmin: groupData.creator === userId,
      isJoined:
        res.session.joinedUsers.includes(userId) ||
        groupData.creator === userId,
      millisecondsToHMFormat: millisecondsToHMFormat,
    },
  };
};

const getMembersListContext = async (groupId, user) => {
  const result = await getMembers("", groupId, user.uid);

  return {
    success: result.success,
    context: {
      count: result.count,
      isAdmin: result.isAdmin,
      members: result.cards,
      lastVisible: result.lastVisible,
    },
  };
};

const getQuizzesListContext = async (groupId, userId) => {
  const result = await getQuizzesByGroupId(groupId, userId);

  return {
    success: result.success,
    context: {
      count: result.count,
      isAdmin: result.isAdmin,
      quizzes: result.cards,
      lastVisible: result.lastVisible,
    },
  };
};

const getDemandesListContext = async (groupId) => {
  const result = await getDemandesByGroupId(groupId);
  return {
    success: result.success,
    context: {
      count: result.count,
      requests: result.cards,
      lastVisible: result.lastVisible,
    },
  };
};

module.exports = {
  GroupFragmentRoutes,
  getSessionInfoContext,
  getMembersListContext,
  getQuizzesListContext,
  getDemandesListContext,
  getGroupInfoContext,
  getGroupChatContext,
};
