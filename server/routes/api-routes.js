const express = require("express");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { createNewUser, logOut, forgotPassword, resendVerification } = require("../controllers/auth");
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
  rejectInviteHandler,
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
  subscribePushHandler,
  getVapidPublicKeyHandler,
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
const { validate } = require("../middleware/validate");
const {
  createGroupSchema,
  joinGroupSchema,
  patchGroupSchema,
  groupIdBodySchema,
  groupIdParamSchema,
  idParamSchema,
  memberActionSchema,
  inviteMembersSchema,
  userGroupsQuerySchema,
  availableGroupsQuerySchema,
  groupMembersQuerySchema,
  usersQuerySchema,
} = require("../schemas/groups.schema");
const {
  createQuizSchema,
  checkQuizTitleSchema,
  quizIdParamSchema,
  updateQuizSchema,
  patchQuizSchema,
  duplicateQuizSchema,
  addQuizResultSchema,
  quizzesQuerySchema,
  groupQuizzesQuerySchema,
  passedQuizzesQuerySchema,
  quizzesListMenuQuerySchema,
  resultsListQuerySchema,
  examenResultQuerySchema,
} = require("../schemas/quizzes.schema");
const {
  createSessionSchema,
  sessionIdBodySchema,
  updateTaskStatusSchema,
  activeSessionsQuerySchema,
  streamSingleSessionQuerySchema,
} = require("../schemas/sessions.schema");
const {
  sendMessageSchema,
  markGroupReadSchema,
  chatMessagesQuerySchema,
  chatStreamQuerySchema,
  recentMessagesQuerySchema,
} = require("../schemas/chat.schema");
const {
  demandeActionSchema,
  groupDemandesQuerySchema,
} = require("../schemas/demandes.schema");
const {
  updateEmailSchema,
  addEmailSchema,
  updateProfileSchema,
  updatePasswordSchema,
  addPasswordSchema,
  closeAccountSchema,
  insertUserDataSchema,
} = require("../schemas/users.schema");
const {
  getUserNotificationsQuerySchema,
} = require("../schemas/notifications.schema");

const apiRouter = express.Router();

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per `window` (here, per hour)
  message: { message: "Too many password reset requests from this IP, please try again after an hour." },
  standardHeaders: true, 
  legacyHeaders: false,
});

const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { message: "Too many verification email requests from this IP, please try again after an hour." },
  standardHeaders: true, 
  legacyHeaders: false,
});

apiRouter.post("/forgot-password", forgotPasswordLimiter, forgotPassword);

apiRouter.post("/resend-verification", resendVerificationLimiter, resendVerification);

apiRouter.post("/insert-user-data", upload.single("file"), validate({ body: insertUserDataSchema }), createNewUser);

apiRouter.get(
  "/session-details/:id",
  validate({ params: idParamSchema }),
  setSessionDetails,
  sendSessionDetails,
);

apiRouter.get(
  "/user-groups",
  validate({ query: userGroupsQuerySchema }),
  getUserGroupsHandler,
);

apiRouter.get(
  "/available-groups",
  validate({ query: availableGroupsQuerySchema }),
  getAvailableGroupsHandler,
);

apiRouter.post(
  "/create-group",
  validate({ body: createGroupSchema }),
  createGroupHandler,
);

apiRouter.post(
  "/join-group",
  validate({ body: joinGroupSchema }),
  joinGroupHandler,
);

apiRouter.patch(
  "/update-group/:groupId",
  validate({ params: groupIdParamSchema, body: patchGroupSchema }),
  patchGroupHandler,
);

apiRouter.post(
  "/create-quiz",
  validate({ body: createQuizSchema }),
  createQuizHandler,
);

apiRouter.post(
  "/check-quiz-title",
  validate({ body: checkQuizTitleSchema }),
  checkQuizTitleHandler,
);

apiRouter.put(
  "/update-quiz/:quizId",
  validate({ params: quizIdParamSchema, body: updateQuizSchema }),
  updateQuizHandler,
);

apiRouter.patch(
  "/update-quiz/:quizId",
  validate({ params: quizIdParamSchema, body: patchQuizSchema }),
  patchQuizHandler,
);

apiRouter.delete(
  "/remove-quiz/:quizId",
  validate({ params: quizIdParamSchema }),
  removeQuizHandler,
);

apiRouter.post(
  "/duplicate-quiz",
  validate({ body: duplicateQuizSchema }),
  duplicateQuizHandler,
);

apiRouter.get(
  "/quizzes",
  validate({ query: quizzesQuerySchema }),
  getQuizzesHandler,
);

apiRouter.get(
  "/quiz-play-details/:quizId",
  validate({ params: quizIdParamSchema }),
  getQuizPlayDetailsHandler,
);

apiRouter.get(
  "/quiz-details/:quizId",
  validate({ params: quizIdParamSchema }),
  getQuizDetailsHandler,
);

apiRouter.get(
  "/quizzes-list-menu",
  validate({ query: quizzesListMenuQuerySchema }),
  getQuizzesListHandler,
);

apiRouter.get("/active-session", getActiveSessionHandler);

apiRouter.get(
  "/active-sessions",
  validate({ query: activeSessionsQuerySchema }),
  getActiveSessionsHandler,
);

apiRouter.get("/stream-sessions", sessionStreamHandler);

apiRouter.get(
  "/stream-single-session",
  validate({ query: streamSingleSessionQuerySchema }),
  streamSingleSessionHandler,
);

apiRouter.post(
  "/update-task-status",
  validate({ body: updateTaskStatusSchema }),
  updateTaskStatusHandler,
);

apiRouter.post(
  "/create-session",
  validate({ body: createSessionSchema }),
  createSessionHandler,
);

// Accept a join request by userId and groupId
apiRouter.post(
  "/accept-demande",
  validate({ body: demandeActionSchema }),
  acceptDemandeHandler,
);

// Reject a join request by userId and groupId
apiRouter.post(
  "/reject-demande",
  validate({ body: demandeActionSchema }),
  rejectDemandeHandler,
);

// Join a session by sessionId
apiRouter.post(
  "/join-session",
  validate({ body: sessionIdBodySchema }),
  joinSessionHandler,
);

// Remove a group by groupId
apiRouter.delete(
  "/remove-group/:groupId",
  validate({ params: groupIdParamSchema }),
  removeGroupHandler,
);

// Leave a group by userId and groupId
apiRouter.post(
  "/leave-group",
  validate({ body: groupIdBodySchema }),
  leaveGroupHandler,
);

// Kick a member from a group by groupId and userId
apiRouter.post(
  "/kick-member",
  validate({ body: memberActionSchema }),
  kickMemberHandler,
);

// Transfer role in a group by groupId, fromUserId, toUserId
apiRouter.post(
  "/transfer-role",
  validate({ body: memberActionSchema }),
  transferRoleHandler,
);

// End a session by sessionId
apiRouter.post(
  "/end-session",
  validate({ body: sessionIdBodySchema }),
  endSessionHandler,
);

// Leave a session by sessionId and userId
apiRouter.post(
  "/leave-session",
  validate({ body: sessionIdBodySchema }),
  leaveSessionHandler,
);

apiRouter.post(
  "/add-quiz-result",
  validate({ body: addQuizResultSchema }),
  addQuizResultHandler,
);

// Get examen result by userId and quizId
apiRouter.get(
  "/examen-result",
  validate({ query: examenResultQuerySchema }),
  getExamenResultHandler,
);

apiRouter.get(
  "/results-list",
  validate({ query: resultsListQuerySchema }),
  getResultsListHandler,
);

apiRouter.get("/users", validate({ query: usersQuerySchema }), getUsersHandler);

apiRouter.post(
  "/invite-users",
  validate({ body: inviteMembersSchema }),
  inviteMembersHandler,
);

apiRouter.post(
  "/reject-invite",
  validate({ body: groupIdBodySchema }),
  rejectInviteHandler,
);

apiRouter.get(
  "/group-quizzes",
  validate({ query: groupQuizzesQuerySchema }),
  getQuizzesByGroup,
);

apiRouter.get(
  "/passed-quizzes",
  validate({ query: passedQuizzesQuerySchema }),
  getPassedQuizzesHandler,
);

apiRouter.get(
  "/group-demandes",
  validate({ query: groupDemandesQuerySchema }),
  getDemandesByGroup,
);

apiRouter.get(
  "/group-members",
  validate({ query: groupMembersQuerySchema }),
  getMembersByGroup,
);

apiRouter.get("/user-info", getUserInfoHandler);

apiRouter.patch(
  "/update-email",
  validate({ body: updateEmailSchema }),
  updateEmailHandler,
);

apiRouter.post(
  "/add-email",
  validate({ body: addEmailSchema }),
  addEmailHandler,
);

apiRouter.patch(
  "/update-profile",
  upload.single("file"),
  validate({ body: updateProfileSchema }),
  updatePofileHandler,
);

apiRouter.patch(
  "/update-password",
  validate({ body: updatePasswordSchema }),
  updatePasswordHandler,
);

apiRouter.post(
  "/add-password",
  validate({ body: addPasswordSchema }),
  addPasswordHandler,
);

apiRouter.post(
  "/close-account",
  validate({ body: closeAccountSchema }),
  closeAccountHandler,
  logOut,
);

apiRouter.post(
  "/send-message",
  upload.single("file"),
  validate({ body: sendMessageSchema }),
  sendMessageHandler,
);

apiRouter.get(
  "/messages",
  validate({ query: chatMessagesQuerySchema }),
  getMessagesHandler,
);

apiRouter.get(
  "/chat-stream",
  validate({ query: chatStreamQuerySchema }),
  chatStreamHandler,
);

apiRouter.get(
  "/recent-messages",
  validate({ query: recentMessagesQuerySchema }),
  getRecentMessagesHandler,
);

apiRouter.post(
  "/chat/mark-read",
  validate({ body: markGroupReadSchema }),
  markGroupAsReadHandler,
);

apiRouter.get(
  "/chat/state/:groupId",
  validate({ params: groupIdParamSchema }),
  getUserGroupChatStateHandler,
);

apiRouter.get("/recent-messages/stream", recentMessagesStreamHandler);

GroupFragmentRoutes.forEach((config) => {
  apiRouter.get(
    `${config.route}/:id`,
    validate({ params: idParamSchema }),
    generateTemplateContext,
    groupFragmentHandler(config),
  );
});

apiRouter.get(
  "/notifications",
  validate({ query: getUserNotificationsQuerySchema }),
  getUserNotificationsHandler,
);
apiRouter.get("/notifications/stream", streamNotificationsHandler);
apiRouter.post("/notifications/mark-read", markNotificationsAsReadHandler);
apiRouter.post("/notifications/subscribe", subscribePushHandler);
apiRouter.get("/notifications/vapidPublicKey", getVapidPublicKeyHandler);

module.exports = apiRouter;
