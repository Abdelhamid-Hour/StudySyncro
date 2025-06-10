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
} = require("../controllers/groups");
const { generateTemplateContext } = require("../middleware/groups");
const { createGroup } = require("../utils/firebase-utils/group");
const { joinGroup } = require("../utils/firebase-utils/demandes");
const {
  createExamen,
  modiferQuizQuestions,
  updateQuizTitle,
  updateQuizSubject,
} = require("../utils/firebase-utils/examen");
const { Task, Quiz } = require("../utils/global");

const apiRouter = express.Router();

apiRouter.post("/insert-user-data", createNewUser);

apiRouter.get("/session-details/:id", setSessionDetails, sendSessionDetails);

apiRouter.get("/user-groups", getUserGroupsHandler);

apiRouter.get("/available-groups", getAvailableGroupsHandler);

apiRouter.get("/quizzes", getQuizzesHandler);

apiRouter.get("/quiz-questions", getQuizQuestionsHandler);

apiRouter.get("/active-session", (req, res) => {
  return res.status(200).json({
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
        status: "active"
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
    startDate: '2025-06-10T21:23:54.096Z',
    id: "12345",
    groupId: "67890",
    durationInMins: 60, // in minutes
    quiz: null,
  });
});

apiRouter.post("/update-task-status", async (req, res) => {
  const { taskId, status } = req.body;
  const userData = req.user;

  const result = {
    success: true,
    message: `Task ${taskId} status updated to ${status}`,
  };

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
});

apiRouter.post("/create-group", async (req, res) => {
  const formData = req.body.groupData;
  const userData = req.user;
  const result = await createGroup(formData, userData);
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
});

apiRouter.post("/join-group", async (req, res) => {
  console.log(req.body, "req body for join group");
  const groupId = req.body.groupId;

  const result = await joinGroup(groupId, req.user);
  console.log(result, "this is the result");
  if (result.success) {
    return res.status(200).json({ status: result.status });
  }
  return res.status(400).json({ message: result.message });
});

apiRouter.post("/create-quiz", async (req, res) => {
  const quizData = req.body.quizData;
  const userData = req.user;
  console.log(quizData, "this is the quizz data");
  const result = await createExamen(quizData, userData);
  if (result.success) {
    console.log(result.id);
    return res.status(200).json({ quizId: result.id });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
});

apiRouter.put("/update-quiz/:quizId", async (req, res) => {
  const updatedQuestions = req.body.updatedQuestions;
  const newQuestions = req.body.newQuestions;
  const deletedQuestions = req.body.deletedQuestions;
  const quizzId = req.params.quizId;
  const userData = req.user;
  const response = await modiferQuizQuestions(
    updatedQuestions,
    newQuestions,
    deletedQuestions,
    quizzId,
    userData.uid
  );

  if (result.success) {
    return res.status(200).json({ message: response.message });
  } else {
    return res.status(400).json({
      message: response.message,
    });
  }
});

apiRouter.patch("/update-quiz/:quizId", async (req, res) => {
  const title = req.body.title;
  const subject = req.body.subject;
  const quizId = req.params.quizId;
  const userData = req.user;
  console.log(title, subject, "quiz data for update quiz");
  const response = title
    ? await updateQuizTitle(title, quizId, userData.uid)
    : await updateQuizSubject(subject, quizId, userData.uid);
  // const result = title ? updateTitle() : updateSubject(); // ? Example logic, replace with actual implementation

  if (response.success) {
    return res.status(200).json({ message: response.message });
  } else {
    return res.status(400).json({
      message: response.message,
    });
  }
});

apiRouter.patch("/update-group/:groupId", async (req, res) => {
  const updatedData = req.body.updatedData;

  // ! Note:
  // ! if the fieldName is visibility, the value is like :
  // ! { visibility: "public", showInSearch: true } // ! showInSearch is optional
  const userData = req.user;
  console.log(updatedData, "group data for update group");

  // TODO: Replace with actual updateGroup logic
  // const result = await updateGroup(groupId, { title, description }, userData);

  const result = {
    success: true,
    message: "Group " + updatedData.fieldName + " updated successfully",
  };

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
});

// ? Group Fragment Routes: Send Group Left Sidebar Content

[
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
