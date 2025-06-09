// const { get } = require("../routes/api-routes");
const { getMembers, getRequests } = require("./firebase-utils/demandes");
const { getExams } = require("./firebase-utils/examen");
const { getGroupByID, getGroupInfo } = require("./firebase-utils/group");
const { millisecondsToHMFormat, Task, Quiz } = require("./global");
const INITIALE_LOADERS_COUNT = 20;
const groups = [];
// !! FOR TESTING
for (let i = 1; i <= 27; i++) {
  groups.push({
    id: i,
    visibility: i % 2 === 0 ? "Public" : "Private",
    isHost: i % 3 === 0,
    name: `Group ${i}`,
    subject: `Subject ${i}`,
    description: `This is the description for Group ${i}.`,
    level: i % 3 === 0 ? "Advanced" : i % 3 === 1 ? "Intermediate" : "Beginner",
    avatars: [
      {
        photoURL: `/avatar${i}_1.png`,
        fullName: "Jhon",
      },
      {
        photoURL: `/avatar${i}_1.png`,
        fullName: "Jhon",
      },
    ],
    extraMembersCount: i % 5,
  });
}

const getUserGroups = (lastVisible = 0, count) => {
  const startIndex = !lastVisible ? 0 : lastVisible - 1;
  const endIndex = Math.min(startIndex + count, groups.length);

  return {
    cards: groups.slice(startIndex, endIndex),
    lastVisible: endIndex < groups.length ? groups[endIndex]?.id : null,
  };
};

const getAvailableGr = (lastVisible = 0, count) => {
  console.log("getAvailableGr", lastVisible, count);

  const startIndex = !lastVisible ? 0 : lastVisible - 1;
  const endIndex = Math.min(startIndex + count, groups.length);
  console.log(startIndex, endIndex);

  return {
    cards: groups.slice(startIndex, endIndex),
    lastVisible: endIndex < groups.length ? groups[endIndex]?.id : null,
  };
};

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

const getQuizzesListContext =async (id , userData) => {
  const response  = await getExams(id , userData.uid)
  return {
    count : response.count , 
    isAdmin : response.isAdmin ,
    quizzes : response.quizzes
  }
  
  
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
  getAvailableGr,
  getUserGroups,
};
