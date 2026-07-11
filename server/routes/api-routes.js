const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { createNewUser, logOut } = require("../controllers/auth");
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
  kickMemberHandler,
  transferRoleHandler,
  getUsersHandler,
  inviteMembersHandler,
  getQuizzesByGroup,
  getMembersByGroup,
  getDemandesByGroup,
  getPassedQuizzesHandler,
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
  checkQuizTitleHandler,
  duplicateQuizHandler,
  removeQuizHandler,
} = require("../controllers/quizzes");
const {
  getActiveSessionHandler,
  updateTaskStatusHandler,
  createSessionHandler,
  joinSessionHandler,
  endSessionHandler,
  leaveSessionHandler,
  getActiveSessionsHandler,
  sessionStreamHandler,
  streamSingleSessionHandler,
} = require("../controllers/session");
const {
  acceptDemandeHandler,
  rejectDemandeHandler,
} = require("../controllers/demandes");
const {
  getUserNotificationsHandler,
  markNotificationsAsReadHandler,
  streamNotificationsHandler,
} = require("../controllers/notifications");
const { GroupFragmentRoutes } = require("../utils/groups");
const {
  getUserInfoHandler,
  updateEmailHandler,
  addEmailHandler,
  updatePofileHandler,
  updatePasswordHandler,
  addPasswordHandler,
  closeAccountHandler,
} = require("../controllers/user");
const {
  sendMessageHandler,
  chatStreamHandler,
  getMessagesHandler,
  markGroupAsReadHandler,
  getUserGroupChatStateHandler,
  getRecentMessagesHandler,
  recentMessagesStreamHandler,
} = require("../controllers/chat");

const apiRouter = express.Router();

apiRouter.post("/insert-user-data", upload.single("file"), createNewUser);

apiRouter.get("/session-details/:id", setSessionDetails, sendSessionDetails);

apiRouter.get("/user-groups", getUserGroupsHandler);

apiRouter.get("/available-groups", getAvailableGroupsHandler);

apiRouter.post("/create-group", createGroupHandler);

apiRouter.post("/join-group", joinGroupHandler);

apiRouter.patch("/update-group/:groupId", patchGroupHandler);

apiRouter.post("/create-quiz", createQuizHandler);

apiRouter.post("/check-quiz-title", checkQuizTitleHandler);

apiRouter.put("/update-quiz/:quizId", updateQuizHandler);

apiRouter.patch("/update-quiz/:quizId", patchQuizHandler);

apiRouter.delete("/remove-quiz/:quizId", removeQuizHandler);

apiRouter.post("/duplicate-quiz", duplicateQuizHandler);

apiRouter.get("/quizzes", getQuizzesHandler);

apiRouter.get("/quiz-play-details/:quizId", getQuizPlayDetailsHandler);

apiRouter.get("/quiz-details/:quizId", getQuizDetailsHandler);

apiRouter.get("/quizzes-list-menu", getQuizzesListHandler);

apiRouter.get("/active-session", getActiveSessionHandler);

apiRouter.get("/active-sessions", getActiveSessionsHandler);

apiRouter.get("/stream-sessions", sessionStreamHandler);

apiRouter.get("/stream-single-session", streamSingleSessionHandler);

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

apiRouter.get("/group-quizzes", getQuizzesByGroup);

apiRouter.get("/passed-quizzes", getPassedQuizzesHandler);

apiRouter.get("/group-demandes", getDemandesByGroup);

apiRouter.get("/group-members", getMembersByGroup);

apiRouter.get("/user-info", getUserInfoHandler);

apiRouter.patch("/update-email", updateEmailHandler);

apiRouter.post("/add-email", addEmailHandler);

apiRouter.patch("/update-profile", upload.single("file"), updatePofileHandler);

apiRouter.patch("/update-password", updatePasswordHandler);

apiRouter.post("/add-password", addPasswordHandler);

apiRouter.post("/close-account", closeAccountHandler, logOut);

apiRouter.post("/send-message", upload.single("file"), sendMessageHandler);

apiRouter.get("/messages", getMessagesHandler);

apiRouter.get("/chat-stream", chatStreamHandler);

apiRouter.get("/recent-messages", getRecentMessagesHandler);
apiRouter.post("/chat/mark-read", markGroupAsReadHandler);
apiRouter.get("/chat/state/:groupId", getUserGroupChatStateHandler);
apiRouter.get("/recent-messages/stream", recentMessagesStreamHandler);

GroupFragmentRoutes.forEach((config) => {
  apiRouter.get(
    `${config.route}/:id`,
    generateTemplateContext,
    groupFragmentHandler(config),
  );
});

apiRouter.get("/notifications", getUserNotificationsHandler);
apiRouter.get("/notifications/stream", streamNotificationsHandler);
apiRouter.post("/notifications/mark-read", markNotificationsAsReadHandler);

module.exports = apiRouter;
