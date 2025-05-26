const { millisecondsToHMFormat, Task, Quiz } = require('./global');
const INITIALE_LOADERS_COUNT = 20;
const groups = [];
// !! FOR TESTING
for (let i = 1; i <= 27; i++) {
  groups.push({
    id: i,
    isPublic: i % 2 === 0,
    isHost: i % 3 === 0,
    title: `Group ${i}`,
    subject: `Subject ${i}`,
    description: `This is the description for Group ${i}.`,
    level: i % 3 === 0 ? 'Advanced' : i % 3 === 1 ? 'Intermediate' : 'Beginner',
    avatars: [`/avatar${i}_1.png`, `/avatar${i}_2.png`],
    extraMembersCount: i % 5,
  });
}

const getUserGroups = (nextLastId = 0, count) => {
  const startIndex = !nextLastId ? 0 : nextLastId - 1;
  const endIndex = Math.min(startIndex + count, groups.length);

  return {
    cards: groups.slice(startIndex, endIndex),
    nextLastId: endIndex < groups.length ? groups[endIndex]?.id : null,
  };
};

const getAvailableGroups = (nextLastId = 0, count) => {
  const startIndex = !nextLastId ? 0 : nextLastId - 1;
  const endIndex = Math.min(startIndex + count, groups.length);
  return {
    cards: groups.slice(startIndex, endIndex),
    nextLastId: endIndex < groups.length ? groups[endIndex]?.id : null,
  };
};

const getGroupChatContext = (groupId) => {
  return {
    groupId: groupId,
    groupName: 'Awesome Study Group',
    isAdmin: true,
    sessionActive: false,
  };
};

// Group Left Side Bar Contexts

const getGroupInfoContext = () => {
  return {
    groupName: '<h1>Awesome Study Group</h1>',
    groupDescription:
      'A group for collaborative learning and sharing knowledge.',
    subject: 'Mathematics',
    level: 'Intermediate',
    visibility: 'Public',
    showInSearch: true,
    maxMembers: 30,
    creationDate: '2023-09-01',
    Admin: {
      fullName: 'Emily Clark',
      photoURL: 'https://avatar.iran.liara.run/public/5',
    },
    members: [
      {
        fullName: 'Emily Clark',
        photoURL: '',
      },
      {
        fullName: 'John Doe',
        photoURL: 'https://avatar.iran.liara.run/public/7',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/8',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/9',
      },
    ],
    isAdmin: true,
  };
};

const getSessionInfoContext = () => {
  return {
    isAdmin: true,
    isJoined: true,
    sessionName: 'Session Name',
    sessionDescription: 'Session Description',
    quizTitle: 'Quiz Title',
    duration: '1h 20m',
    startTime: '14:00',
    endTime: '15:00',
    joinedCount: 5,
    tasks: [
      new Task({
        title: 'Introduction to JavaScript',
        description:
          'Learn the basics of JavaScript, including syntax and variables.',
        durationInMins: 2, // in minutes
      }),
      new Task({
        title: 'JavaScript Functions',
        description:
          'Understand how to create and use functions in JavaScript.',
        durationInMins: 45, // in minutes
      }),
      new Quiz({
        UID: '123',
        title: 'JavaScript Quiz',
        description: 'Test your knowledge of JavaScript basics.',
        durationInMins: 10, // in minutes
        questionsCount: 10,
      }),
    ],
    millisecondsToHMFormat: millisecondsToHMFormat,
    Quiz,
  };
};

const getMembersListContext = () => {
  return {
    isAdmin: true,
    count: 20,
    members: [
      {
        fullName: 'Emily Clark',
        photoURL: '',
      },
      {
        fullName: 'John Doe',
        photoURL: 'https://avatar.iran.liara.run/public/7',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/8',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/9',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/8',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/9',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/8',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/9',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/8',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/9',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/8',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/9',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/8',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/9',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/8',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/9',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/8',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/9',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/8',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/9',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/8',
      },
      {
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/9',
      },
    ],
  };
};

const getQuizzesListContext = () => {
  return {
    count: 4,
    isAdmin: true,
    quizzes: [
      {
        quizId: 101,
        quizTitle: 'Algebra Basics',
        sessionName: 'Math Morning',
        questionsCount: 7,
        quizDate: '2024-05-10 09:00',
      },
      {
        quizId: 102,
        quizTitle: 'World Capitals',
        sessionName: 'Geography Fun',
        questionsCount: 9,
        quizDate: '2024-05-12 11:30',
      },
      {
        quizId: 103,
        quizTitle: 'Physics Challenge',
        sessionName: 'Science Hour',
        questionsCount: 11,
        quizDate: '2024-05-15 14:15',
      },
      {
        quizId: 104,
        quizTitle: 'Literature Quiz',
        sessionName: 'Book Club',
        questionsCount: 6,
        quizDate: '2024-05-18 16:45',
      },
    ],
  };
};

const getDemandesListContext = () => {
  return {
    count: 3,
    isAdmin: true,
    demandes: [
      {
        userId: 1,
        fullName: 'John Doe',
        photoURL: 'https://avatar.iran.liara.run/public/7',
        demandeDate: '2024-05-01 12:00',
      },
      {
        userId: 2,
        fullName: 'Jane Smith',
        photoURL: 'https://avatar.iran.liara.run/public/8',
        demandeDate: '2024-05-02 12:00',
      },
      {
        userId: 3,
        fullName: 'Alice Johnson',
        photoURL: 'https://avatar.iran.liara.run/public/9',
        demandeDate: '2024-05-03 12:00',
      },
    ],
  };
};

module.exports = {
  INITIALE_LOADERS_COUNT,
  getSessionInfoContext,
  getMembersListContext,
  getQuizzesListContext,
  getDemandesListContext,
  getGroupInfoContext,
  getGroupChatContext,
  getAvailableGroups,
  getUserGroups,
};
