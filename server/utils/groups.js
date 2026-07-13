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
const { millisecondsToHMFormat, Task, Quiz } = require("./global");
const GroupFragmentRoutes = [
  { route: "/group-info", title: "Group Informations" },
  { route: "/session-info", title: "Session Informations" },
  { route: "/members-list", title: "Members" },
  { route: "/demandes-list", title: "Join Requests" },
  { route: "/quizzes-list", title: "Quizzes" },
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
      message: "Group Not exists",
    };

  const res = await getSessionInformations(groupData.currentSession);

  if (!res.success) {
    return {
      success: false,
      message: res.message || "Failed to load session information",
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
