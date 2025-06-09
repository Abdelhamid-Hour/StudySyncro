const express = require("express");
const { createNewUser } = require("../controllers/auth");
const { setSessionDetails } = require("../middleware/home");
const { sendSessionDetails } = require("../controllers/home");
const {
  getUserGroupsHandler,
  getAvailableGroupsHandler,
  groupFragmentHandler,
  getQuizQuestionsHandler,
} = require("../controllers/groups");
const { generateTemplateContext } = require("../middleware/groups");
const { createGroup } = require("../utils/firebase-utils/group");
const { joinGroup } = require("../utils/firebase-utils/demandes");
const { createExamen , modiferQuizQuestions, updateQuizTitle, updateQuizSubject } = require("../utils/firebase-utils/examen");

const apiRouter = express.Router();

apiRouter.post("/insert-user-data", createNewUser);

apiRouter.get("/session-details/:id", setSessionDetails, sendSessionDetails);

apiRouter.get("/user-groups", getUserGroupsHandler);

apiRouter.get("/available-groups", getAvailableGroupsHandler);

apiRouter.get("/quiz-questions", getQuizQuestionsHandler);

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
  console.log(quizData , "this is the quizz data")
  const  result  = await createExamen(quizData , userData)
  if (result.success) {
    console.log(result.id)
    return res.status(200).json({ quizId: result.id });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
});

apiRouter.put("/update-quiz/:quizId", async (req, res) => {
  const updatedQuestions = req.body.updatedQuestions;
  const newQuestions = req.body.newQuestions 
  const deletedQuestions = req.body.deletedQuestions
  const quizzId = req.params.quizId 
  const userData = req.user;
  const response =await  modiferQuizQuestions(updatedQuestions , newQuestions , deletedQuestions , quizzId , userData.uid)
  
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
  const quizId = req.params.quizId
  const userData = req.user;
  console.log(title, subject, "quiz data for update quiz");
 const response = title ? await updateQuizTitle(title , quizId , userData.uid ) : await updateQuizSubject(subject , quizId , userData.uid)
  // const result = title ? updateTitle() : updateSubject(); // ? Example logic, replace with actual implementation

 

  if (response.success) {
    return res.status(200).json({ message: response.message });
  } else {
    return res.status(400).json({
      message: response.message,
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
