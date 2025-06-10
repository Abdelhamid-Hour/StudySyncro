// const { get } = require("../routes/api-routes");
const { getMembers, getRequests } = require("./firebase-utils/demandes");
const { getExams } = require("./firebase-utils/examen");
const { getGroupInfo } = require("./firebase-utils/group");
const { millisecondsToHMFormat, Task, Quiz } = require("./global");
const INITIALE_LOADERS_COUNT = 20;

const getGroupChatContext = (groupId) => {
  return {
    groupId: groupId,
    groupName: "Awesome Study Group",
    isAdmin: true,
    sessionActive: false,
  };
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

  return result;
};

const getQuizzesListContext = async (id, userData) => {
  return await getExams(id, userData.uid);
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
  getGroupChatContext
};
