const express = require("express");
const { createNewUser } = require("../controllers/auth");
const { setSessionDetails } = require("../middleware/home");
const { sendSessionDetails } = require("../controllers/home");
const {
  getUserGroupsHandler,
  getAvailableGroupsHandler,
  groupFragmentHandler,
  getQuizPlayDetailsHandler,
  getQuizzesHandler,
  createGroupHandler,
  joinGroupHandler,
  patchGroupHandler,
  removeGroupHandler,
  leaveGroupHandler,
  addMemberHandler,
  kickMemberHandler,
  transferRoleHandler,
  getUsersHandler,
  inviteMembersHandler,
} = require("../controllers/groups");
const { generateTemplateContext } = require("../middleware/groups");
const {
  createQuizHandler,
  updateQuizHandler,
  patchQuizHandler,
  getResultsListHandler,
  getQuizDetailsHandler,
  getQuizzesListHandler,
  addQuizResultHandler,
  getExamenResultHandler,
} = require("../controllers/quizzes");
const {
  getActiveSessionHandler,
  updateTaskStatusHandler,
  createSessionHandler,
  joinSessionHandler,
  endSessionHandler,
  leaveSessionHandler,
} = require("../controllers/session");
const {
  acceptDemandeHandler,
  rejectDemandeHandler,
} = require("../controllers/demandes");
const { GroupFragmentRoutes } = require("../utils/groups");

const apiRouter = express.Router();

apiRouter.post("/insert-user-data", createNewUser);

apiRouter.get("/session-details/:id", setSessionDetails, sendSessionDetails);

apiRouter.get("/user-groups", getUserGroupsHandler);

apiRouter.get("/available-groups", getAvailableGroupsHandler);

apiRouter.post("/create-group", createGroupHandler);

apiRouter.post("/join-group", joinGroupHandler);

apiRouter.patch("/update-group/:groupId", patchGroupHandler);

apiRouter.post("/create-quiz", createQuizHandler);

apiRouter.put("/update-quiz/:quizId", updateQuizHandler);

apiRouter.patch("/update-quiz/:quizId", patchQuizHandler);

apiRouter.get("/quizzes", getQuizzesHandler);

apiRouter.get("/quiz-play-details/:quizId", getQuizPlayDetailsHandler);

apiRouter.get("/quiz-details/:quizId", getQuizDetailsHandler);

apiRouter.get("/quizzes-list", getQuizzesListHandler);

apiRouter.get("/active-session", getActiveSessionHandler);

apiRouter.post("/update-task-status", updateTaskStatusHandler);

apiRouter.post("/create-session", createSessionHandler);

// Accept a join request by userId and groupId
apiRouter.post("/accept-demande", acceptDemandeHandler);

// Reject a join request by userId and groupId
apiRouter.post("/reject-demande", rejectDemandeHandler);

// Join a session by sessionId
apiRouter.post("/join-session", joinSessionHandler);

// Remove a group by groupId
apiRouter.delete("/remove-group/:groupId", removeGroupHandler);

// Leave a group by userId and groupId
apiRouter.post("/leave-group", leaveGroupHandler);

// Add members to a group by userId(s) and groupId
apiRouter.post("/add-member", addMemberHandler);

// Kick a member from a group by groupId and userId
apiRouter.post("/kick-member", kickMemberHandler);

// Transfer role in a group by groupId, fromUserId, toUserId
apiRouter.post("/transfer-role", transferRoleHandler);

// End a session by sessionId
apiRouter.post("/end-session", endSessionHandler);

// Leave a session by sessionId and userId
apiRouter.post("/leave-session", leaveSessionHandler);

apiRouter.post("/add-quiz-result", addQuizResultHandler);

// Get examen result by userId and quizId
apiRouter.get("/examen-result", getExamenResultHandler);

apiRouter.get("/results-list", getResultsListHandler);

apiRouter.get("/users", getUsersHandler);

apiRouter.post("/invite-users", inviteMembersHandler);

GroupFragmentRoutes.forEach((config) => {
  apiRouter.get(
    `${config.route}/:id`,
    generateTemplateContext,
    groupFragmentHandler(config)
  );
});

module.exports = apiRouter;
