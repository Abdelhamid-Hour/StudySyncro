const {
  getJoinedGroups,
  getAvailableGroups,
} = require("../utils/firebase-utils/group");

const getUserGroupsHandler = async (req, res) => {
  const { lastVisible, count, level, visibility, searchTerm, sort, role } =
    req.query;
  console.log("Query Parameters:", req.query);

  const creteria = {
    level: level ? level.split(",") : [],
    visibility: visibility ? visibility.split(",") : [],
    searchTerm: searchTerm || "",
    sort: sort || "desc",
    role: role ? role.split(",") : [],
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
  const {
    lastVisible,
    count,
    level,
    visibility,
    searchTerm,
    sort,
    joinableOnly,
  } = req.query;
  const creteria = {
    level: level ? level.split(",") : [],
    visibility: visibility ? visibility.split(",") : [],
    searchTerm: searchTerm || "",
    sort: sort || "desc",
    available: joinableOnly,
  };

  const data = await getAvailableGroups(
    req.user.uid,
    creteria,
    parseInt(count, 10),
    lastVisible
  );

  return res.json(data);
};



const getQuizzesHandler = async (req, res) => {
  const {
    searchTerm,
    sort
  } = req.query;
  const creteria = {
    searchTerm: searchTerm || "",
    sort: sort || "desc"
  };

  const data = {
    cards: [
      {
        id: "quiz1",
        title: "Algebra Essentials",
        questionsCount: 12,
        sharedGroups: 3,
        sharedSessions: 7,
        subject: "Mathematics",
      },
      {
        id: "quiz2",
        title: "World Capitals Challenge",
        questionsCount: 10,
        sharedGroups: 2,
        sharedSessions: 5,
        subject: "Geography",
      },
      {
        id: "quiz3",
        title: "Physics Fundamentals",
        questionsCount: 15,
        sharedGroups: 4,
        sharedSessions: 8,
        subject: "Science",
      },
      {
        id: "quiz4",
        title: "Modern History",
        questionsCount: 9,
        sharedGroups: 2,
        sharedSessions: 3,
        subject: "History",
      },
      {
        id: "quiz5",
        title: "General Knowledge Mix",
        questionsCount: 20,
        sharedGroups: 5,
        sharedSessions: 10,
        subject: "General",
      },
      {
        id: "quiz6",
        title: "English Vocabulary",
        questionsCount: 14,
        sharedGroups: 3,
        sharedSessions: 6,
        subject: "English",
      },
      {
        id: "quiz7",
        title: "Chemistry Basics",
        questionsCount: 11,
        sharedGroups: 2,
        sharedSessions: 4,
        subject: "Science",
      },
      {
        id: "quiz8",
        title: "African Geography",
        questionsCount: 8,
        sharedGroups: 1,
        sharedSessions: 2,
        subject: "Geography",
      },
      {
        id: "quiz9",
        title: "Computer Science Intro",
        questionsCount: 13,
        sharedGroups: 3,
        sharedSessions: 7,
        subject: "Technology",
      },
      {
        id: "quiz10",
        title: "French Language Basics",
        questionsCount: 10,
        sharedGroups: 2,
        sharedSessions: 3,
        subject: "French",
      },
      {
        id: "quiz11",
        title: "Moroccan Culture",
        questionsCount: 7,
        sharedGroups: 2,
        sharedSessions: 2,
        subject: "Culture",
      },
      {
        id: "quiz12",
        title: "Environmental Science",
        questionsCount: 16,
        sharedGroups: 4,
        sharedSessions: 9,
        subject: "Science",
      },
    ],
    lastVisible: null,
  }

  return res.json(data);
};

const groupFragmentHandler =
  ({ route, title }) =>
  (req, res) => {
    if (!res.payload.success)
      return res.status(400).json({
        message: res.payload.message || "Failed to load.",
      });
    return res.render(
      `fragments/my-groups${route}`,
      {
        ...res.payload.context,
      },
      (err, template) => {
        if (err) {
          console.error("Error rendering template:", err);
          return res.status(500).json({
            message: "Failed to load group info. Please try again later.",
          });
        }

        const response = { template, title };

        if (res.payload.context.count)
          response.count = res.payload.context.count;

        if (route === "/group-info")
          response.info = {
            ...res.payload.context,
          };

        res.json(response);
      }
    );
  };

const getQuizQuestionsHandler = (req, res) => {
  const userid = req.user.uid;
  const query = req.query;

  return res.json({
    questions: [
      {
        id: "q1",
        text: "What is the capital of Morocco?",
        choices: ["Casablanca", "Marrakesh", "Fez", "Rabat"],
        correctAnswerIndex: 3, // Rabat
      },
      {
        id: "q2",
        text: "How many planets are there in the solar system?",
        choices: ["7", "8", "9", "10"],
        correctAnswerIndex: 1, // 8
      },
      {
        id: "q3",
        text: "What is the result of 9 × 6?",
        choices: ["54", "56", "59", "60"],
        correctAnswerIndex: 0, // 54
      },
      {
        id: "q4",
        text: "Who invented the electric light bulb?",
        choices: ["Einstein", "Edison", "Newton", "Beethoven"],
        correctAnswerIndex: 1, // Edison
      },
      {
        id: "q5",
        text: "What is 100 minus 47?",
        choices: ["52", "53", "54", "55"],
        correctAnswerIndex: 1, // 53
      },
      {
        id: "q6",
        text: "Which of these animals cannot fly?",
        choices: ["Eagle", "Ostrich", "Bat", "Pigeon"],
        correctAnswerIndex: 1, // Ostrich
      },
      {
        id: "q7",
        text: "How many minutes are there in one hour?",
        choices: ["60", "100", "45", "90"],
        correctAnswerIndex: 0, // 60
      },
      {
        id: "q8",
        text: "What is the sum of 11 and 22?",
        choices: ["31", "32", "33", "34"],
        correctAnswerIndex: 2, // 33
      },
      {
        id: "q9",
        text: "What is the official language of Morocco?",
        choices: ["French", "Tamazight", "Arabic", "English"],
        correctAnswerIndex: 2, // Arabic
      },
      {
        id: "q10",
        text: "Which continent is Egypt located in?",
        choices: ["Asia", "Europe", "Africa", "South America"],
        correctAnswerIndex: 2, // Africa
      },
    ],
    id: "vghtyiTYivuyRXtiYUvTYX",
    duration: 20, // Duration in minutes
  });
};

module.exports = {
  getUserGroupsHandler,
  getAvailableGroupsHandler,
  groupFragmentHandler,
  getQuizQuestionsHandler,
  getQuizzesHandler
};
