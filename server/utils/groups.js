// const { get } = require("../routes/api-routes");
const { db } = require("../firebase/firebaseAdmin");
const { getRequests } = require("./firebase-utils/demandes");
const { getExams } = require("./firebase-utils/examen");
const { getGroupInfo, getChatContext } = require("./firebase-utils/group");
const { getMembers } = require("./firebase-utils/members");
const { getSessionInformations } = require("./firebase-utils/session");
const { millisecondsToHMFormat, Task, Quiz } = require("./global");
const INITIALE_LOADERS_COUNT = 20;
const GroupFragmentRoutes = [
  { route: "/group-info", title: "Group Informations" },
  { route: "/session-info", title: "Session Informations" },
  { route: "/members-list", title: "Members" },
  { route: "/demandes-list", title: "Join Requests" },
  { route: "/quizzes-list", title: "Quizzes" },
];

const getGroupChatContext = async (userId, groupId) => {
  const result = await getChatContext(userId, groupId);

  return result;
};
// Group Left Side Bar Contexts
const getGroupInfoContext = async (id, user) => {
  const groupInfo = await getGroupInfo(id, user.uid);
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

const getMembersListContext = async (id, user) => {
  const result = await getMembers(id, user.uid);

  return result;
};

const getQuizzesListContext = async (id, userData) => {
  return {
    success: true,
    context: {
      count: 4,
      isAdmin: true,
      quizzes: [
        {
          quizId: 101,
          quizTitle: "Algebra Basics",
          sessionName: "Math Morning",
          questionsCount: 7,
          quizDate: "2024-05-10 09:00",
        },
        {
          quizId: 102,
          quizTitle: "World Capitals",
          sessionName: "Geography Fun",
          questionsCount: 9,
          quizDate: "2024-05-12 11:30",
        },
        {
          quizId: 103,
          quizTitle: "Physics Challenge",
          sessionName: "Science Hour",
          questionsCount: 11,
          quizDate: "2024-05-15 14:15",
        },
        {
          quizId: 104,
          quizTitle: "Literature Quiz",
          sessionName: "Book Club",
          questionsCount: 6,
          quizDate: "2024-05-18 16:45",
        },
      ],
    },
  };
  // return await getExams(id, userData.uid);
};

const getDemandesListContext = async (id, user) => {
  const result = await getRequests(id, user.uid);
  return result;
};

module.exports = {
  INITIALE_LOADERS_COUNT,
  GroupFragmentRoutes,
  getSessionInfoContext,
  getMembersListContext,
  getQuizzesListContext,
  getDemandesListContext,
  getGroupInfoContext,
  getGroupChatContext,
};
