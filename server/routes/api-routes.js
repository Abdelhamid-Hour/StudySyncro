const express = require("express");
const { createNewUser } = require("../controllers/auth");
const { setSessionDetails } = require("../middleware/home");
const { sendSessionDetails } = require("../controllers/home");
const {
  getUserGroupsHandler,
  getAvailableGroupsHandler,
  groupFragmentHandler,
  getQuizQuestionsHandler,
  getQuizzesHandler,
  createGroupHandler,
  joinGroupHandler,
  patchGroupHandler,
} = require("../controllers/groups");
const { generateTemplateContext } = require("../middleware/groups");
const { createGroup, modifyGroup } = require("../utils/firebase-utils/group");
const { joinGroup } = require("../utils/firebase-utils/demandes");
const {
  getQuizzInfo,
  getSessionQuizzes,
} = require("../utils/firebase-utils/examen");
const { Task, Quiz } = require("../utils/global");
const {
  createQuizHandler,
  updateQuizHandler,
  patchQuizHandler,
} = require("../controllers/quizzes");
const { changeTaskState } = require("../utils/firebase-utils/tache");

const apiRouter = express.Router();

apiRouter.post("/insert-user-data", createNewUser); // * Completed

apiRouter.get("/session-details/:id", setSessionDetails, sendSessionDetails); // ! wait until I finish

apiRouter.get("/user-groups", getUserGroupsHandler); // * Completed

apiRouter.get("/available-groups", getAvailableGroupsHandler); // * Completed

apiRouter.post("/create-group", createGroupHandler); // * Completed

apiRouter.post("/join-group", joinGroupHandler); // * Completed

apiRouter.patch("/update-group/:groupId", patchGroupHandler); // * Completed

apiRouter.post("/create-quiz", createQuizHandler); // * Completed

apiRouter.put("/update-quiz/:quizId", updateQuizHandler); // * Completed

apiRouter.patch("/update-quiz/:quizId", patchQuizHandler); // * Completed

apiRouter.get("/quizzes", getQuizzesHandler);

apiRouter.get("/quiz-questions/:quizId", getQuizQuestionsHandler); // * shoult test

apiRouter.get("/quiz-details/:quizId", async (req, res) => {
  const quizId = req.params.quizId;
  const userId = req.user.uid;
  const result = await getQuizzInfo(quizId, userId);

  if (result.success) {
    return res.status(200).json({ ...result.quizData });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
}); // * shoult test

apiRouter.get("/quizzes-list", async (req, res) => {
  const { searchTerm, count, lastVisible } = req.query;
  const result = await getSessionQuizzes(
    req.user.uid,
    lastVisible,
    count,
    searchTerm
  );

  return res.status(200).json({
    ...result,
  });
}); // * shoult test

apiRouter.get("/active-session", (req, res) => {
  const result = {
    success: true,
    sessionData: {
      tasks: [
        new Task({
          UID: "task-1",
          title: "Introduction to JavaScript",
          description:
            "Learn the basics of JavaScript, including syntax and variables.",
          durationInMins: 30, // in minutes
          status: "completed",
        }),
        new Task({
          UID: "task-2",
          title: "Break",
          durationInMins: 5, // in minutes
          isBreak: true,
          status: "active",
        }),
        {
          UID: "123",
          title: "JavaScript Quiz",
          description: "Test your knowledge of JavaScript basics.",
          durationInMins: 10, // in minutes
          questionsCount: 10,
          status: "pending",
        },
      ],
      startDate: "2025-06-10T21:23:54.096Z",
      id: "12345",
      groupId: "67890",
      durationInMins: 60, // in minutes
      quiz: null,
    },
  };

  if (result.success) {
    return res.status(200).json({ ...result.sessionData });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
}); // ! should implement with firebase

apiRouter.post("/update-task-status", async (req, res) => {
  const { taskId, status } = req.body;
  const userData = req.user;
  const result = await changeTaskState(status , taskId)
  console.log(result)
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
}); // ! should implement with firebase

/**
 * {
   {
  name: 'first session ',
  description: 'iuytmlkojhghh',
  sessionQuiz: {
    quiz: {
      title: 'hzhz',
      durationInMins: 5,
      isQuiz: true,
      isBreak: false,
      description: 'lpoijuhygfds'
    },
    UID: 'aMw6hejAA1toscYKE2jB'
  },
  duration: 5,
  tasks: [
    {
      title: 'hzhz',
      durationInMins: 5,
      isQuiz: true,
      isBreak: false,
      description: 'lpoijuhygfds'
    }
  ]
}
        }
    ]
}
 */

apiRouter.post("/create-session", async (req, res) => {
  const sessionData = req.body.sessionData;
  const userData = req.user;
  
  const result = {
    success: true,
    message: "Session created successfully",
  };

  console.log(sessionData);

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
}); // ! should implement with firebase

[
  // ? Group Fragment Routes: Send Group Left Sidebar Content
  { route: "/group-info", title: "Group Informations" },
  { route: "/session-info", title: "Session Informations" },
  { route: "/members-list", title: "Members" },
  { route: "/demandes-list", title: "Join Requests" },
  { route: "/quizzes-list", title: "Quizzes" },
].forEach((config) => {
  apiRouter.get(
    `${config.route}/:id`,
    generateTemplateContext,
    groupFragmentHandler(config)
  );
});

module.exports = apiRouter;
