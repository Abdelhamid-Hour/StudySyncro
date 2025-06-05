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

const apiRouter = express.Router();

apiRouter.post("/insert-user-data", createNewUser);

apiRouter.get("/session-details/:id", setSessionDetails, sendSessionDetails);

apiRouter.get("/user-groups", getUserGroupsHandler);

apiRouter.get("/available-groups", getAvailableGroupsHandler);

apiRouter.get("/quiz-questions", getQuizQuestionsHandler);

apiRouter.post("/create-group", async (req, res) => {
  console.log(req.body, "req body");
  const formData = req.body.groupData;
  const userData = req.user;

  const result = await createGroup(formData, userData);
  if (result) {
    return res.status(200).json({ message: "Groupe créé avec succès" });
  } else {
    return res.status(400).json({
      message: "Une erreur est survenue lors de la création du groupe",
    });
  }
});

apiRouter.post("/join-group", async (req, res) => {
  console.log(req.body, "req body for join group");
  const groupId = req.body.groupId;
  const result = await joinGroup(groupId, req.user.uid);
  console.log(result, "this is the result");
  if (result.success) {
    return res.status(200).json({ status: result.status });
  }
  return res.status(400).json({ message: result.message });
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
