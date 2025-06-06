const { getUserGroups, getAvailableGr } = require('../utils/groups');
const {
  getJoinedGroups,
  getAvailableGroups,
} = require('../utils/firebase-utils/group');

const getUserGroupsHandler = async (req, res) => {
  const { lastVisible, count, level, visibility, searchTerm, sort, role } = req.query;

  const creteria = {
    level: level ? level.split(',') : [],
    visibility: visibility ? visibility.split(',') : [],
    searchTerm: searchTerm || '',
    sort: sort || 'desc',
    role: role ? role.split(',') : []
  };
  
  const data = await getJoinedGroups(
    req.user.uid,
    creteria,
    parseInt(count, 10),
    lastVisible
  );

  return res.json(data);
};

const getAvailableGroupsHandler = async (req, res) => {
  const { lastVisible, count, level, visibility, searchTerm, sort } =
    req.query;
  const creteria = {
    level: level ? level.split(',') : [],
    visibility: visibility ? visibility.split(',') : [],
    searchTerm: searchTerm || '',
    sort: sort || 'desc',
  };
  
  const data = getAvailableGr(
    lastVisible ? parseInt(lastVisible, 10) : 0,
    parseInt(count, 10)
  );

  return res.json(data);
};

const groupFragmentHandler =
  ({ route, title }) =>
  (req, res) => {
    res.render(
      `fragments/my-groups${route}`,
      {
        ...res.context,
      },
      (err, template) => {
        if (err) {
          console.error('Error rendering template:', err);
          return res.status(500).json({
            message: 'Failed to load group info. Please try again later.',
          });
        }

        const response = { template, title };
        if (res.context.count) {
          response.count = res.context.count;
        }

        if (route === '/group-info') {
          response.info = {
            ...res.context,
          };
        }

        res.json(response);
      }
    );
  };

const getQuizQuestionsHandler = (req, res) => {
  return res.json({
    questions: [
      {
        id: 'q1',
        text: 'What is the capital of Morocco?',
        choices: ['Casablanca', 'Marrakesh', 'Fez', 'Rabat'],
        correctAnswerIndex: 3, // Rabat
      },
      {
        id: 'q2',
        text: 'How many planets are there in the solar system?',
        choices: ['7', '8', '9', '10'],
        correctAnswerIndex: 1, // 8
      },
      {
        id: 'q3',
        text: 'What is the result of 9 × 6?',
        choices: ['54', '56', '59', '60'],
        correctAnswerIndex: 0, // 54
      },
      {
        id: 'q4',
        text: 'Who invented the electric light bulb?',
        choices: ['Einstein', 'Edison', 'Newton', 'Beethoven'],
        correctAnswerIndex: 1, // Edison
      },
      {
        id: 'q5',
        text: 'What is 100 minus 47?',
        choices: ['52', '53', '54', '55'],
        correctAnswerIndex: 1, // 53
      },
      {
        id: 'q6',
        text: 'Which of these animals cannot fly?',
        choices: ['Eagle', 'Ostrich', 'Bat', 'Pigeon'],
        correctAnswerIndex: 1, // Ostrich
      },
      {
        id: 'q7',
        text: 'How many minutes are there in one hour?',
        choices: ['60', '100', '45', '90'],
        correctAnswerIndex: 0, // 60
      },
      {
        id: 'q8',
        text: 'What is the sum of 11 and 22?',
        choices: ['31', '32', '33', '34'],
        correctAnswerIndex: 2, // 33
      },
      {
        id: 'q9',
        text: 'What is the official language of Morocco?',
        choices: ['French', 'Tamazight', 'Arabic', 'English'],
        correctAnswerIndex: 2, // Arabic
      },
      {
        id: 'q10',
        text: 'Which continent is Egypt located in?',
        choices: ['Asia', 'Europe', 'Africa', 'South America'],
        correctAnswerIndex: 2, // Africa
      },
    ],
    id: 'vghtyiTYivuyRXtiYUvTYX',
    duration: 20, // Duration in minutes
  });
};

module.exports = {
  getUserGroupsHandler,
  getAvailableGroupsHandler,
  groupFragmentHandler,
  getQuizQuestionsHandler,
};
