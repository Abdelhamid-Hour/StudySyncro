const { getJoinedGroups } = require('./firebase-utils/group');
const { getCurrentSessionInfo, getSessionInformations, getFetchActiveSessions } = require('./firebase-utils/session');
const {
  Task,
  Quiz,
  formatHoursMinutes,
  millisecondsToHMFormat,
  pathNames,
} = require('./global');

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
  const result = await getSessionInformations(sessionId)
  return result 
  // const tasks = [
  //   new Task({
  //     title: 'Introduction to Ja      vaScript',
  //     description:
  //       'Learn the basics of JavaScript, including syntax and variables.',
  //     durationInMins: 2, // in minutes
  //   }),
  //   new Task({
  //     title: 'JavaScript Functions',
  //     description: 'Understand how to create and use functions in JavaScript.',
  //     durationInMins: 45, // in minutes
  //   }),
  //   new Quiz({
  //     UID: '123',
  //     title: 'JavaScript Quiz',
  //     description: 'Test your knowledge of JavaScript basics.',
  //     durationInMins: 10, // in minutes
  //     questionsCount: 10,
  //   }),
  // ];

  // const durationInMins = tasks.reduce(
  //   (acc, task) => (acc += task.durationInMins),
  //   0
  // );
  // const startDate = new Date().toISOString();
  // const endTime = new Date(startDate).getTime() + durationInMins * 60 * 1000;
  // const quiz = tasks.filter((task) => task.isQuiz)[0];
  // return {
  //   name: 'Session de révision - Janvier 2025',
  //   description: 'Description de la session',
  //   startTime: formatHoursMinutes(startDate),
  //   endTime: formatHoursMinutes(endTime),
  //   duration: millisecondsToHMFormat(durationInMins * 60 * 1000),
  //   groupName: 'Frontend Developers',
  //   joinedCount: 25,
  //   tasks: tasks,
  //   quiz: {
  //     UID: '123',
  //     title: 'JavaScript Quiz',
  //     questionsCount: 10,
  //     status: 'pending',
  //   },
  //   millisecondsToHMFormat: millisecondsToHMFormat,
  // };
};

const getActiveSessions = async(userId) => {
  // TODO: Fetch active sessions from the database
   const sessions = await getFetchActiveSessions(userId)
   return sessions
};

const fetchHomeData = async (userId) => {
  const session = await getCurrentSessionInfo(userId); // or null
  if (session) {
    return {
      pathName: pathNames.home.active,
      payload: { templateContext: { session } },
    };
  }
  

  const availableSessions = await getActiveSessions(userId);  

  return {
    pathName: pathNames.home.inactive,
    payload: { templateContext: { availableSessions } },
  };
};

module.exports = {
  fetchHomeData,
  getSessionDetails,
};
