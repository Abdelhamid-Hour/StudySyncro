// const { get } = require("../routes/api-routes");
const { getMembers, getRequests } = require("./firebase-utils/demandes");
const { getExams } = require("./firebase-utils/examen");
const { getGroupInfo, getChatContext } = require("./firebase-utils/group");
const { millisecondsToHMFormat, Task, Quiz } = require("./global");
const INITIALE_LOADERS_COUNT = 20;

const getGroupChatContext = async (userId, groupId) => {
  const result = await getChatContext(userId, groupId);
  console.log("reult", result);

  return result;
};

// Group Left Side Bar Contexts

const getGroupInfoContext = async (id, user) => {
  console.log(id, user, "this is the data from the router");
  const groupInfo = await getGroupInfo(id, user.uid);
  console.log("group info", groupInfo);
  return groupInfo;
};

const getSessionInfoContext = () => {
  return {
    success: true,
    context: {
      isAdmin: true,
      isJoined: true,
      sessionName: "Session Name",
      sessionDescription: "Session Description",
      quizTitle: "Quiz Title",
      duration: "1h 20m",
      startTime: "14:00",
      endTime: "15:00",
      joinedCount: 5,
      tasks: [
        new Task({
          title: "Introduction to JavaScript",
          description:
            "Learn the basics of JavaScript, including syntax and variables.",
          durationInMins: 2, // in minutes
        }),
        new Task({
          title: "JavaScript Functions",
          description:
            "Understand how to create and use functions in JavaScript.",
          durationInMins: 45, // in minutes
        }),
        new Quiz({
          UID: "123",
          title: "JavaScript Quiz",
          description: "Test your knowledge of JavaScript basics.",
          durationInMins: 10, // in minutes
          questionsCount: 10,
        }),
      ],
      millisecondsToHMFormat: millisecondsToHMFormat,
      Quiz,
    },
  };
};

const getMembersListContext = async (id, user) => {
  const result = await getMembers(id, user.uid);
  console.log(result.context.members);

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
  getSessionInfoContext,
  getMembersListContext,
  getQuizzesListContext,
  getDemandesListContext,
  getGroupInfoContext,
  getGroupChatContext,
};
