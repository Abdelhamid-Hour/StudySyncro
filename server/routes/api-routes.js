const express = require("express");
const { createNewUser, createSession } = require("../controllers/auth");
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
const {
  createGroup,
  modifyGroup,
  deleteGroup,
  quitterGroup,
  modifieGroupPropertie,
} = require("../utils/firebase-utils/group");
const {
  joinGroup,
  acceptRequest,
  rejectRequest,
  ajouterMembre,
  kickMember,
} = require("../utils/firebase-utils/demandes");
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
const {
  createGroupSession,
  getActiveSession,
  annulerSession,
  leavSession,
} = require("../utils/firebase-utils/session");

const apiRouter = express.Router();

apiRouter.post("/insert-user-data", createNewUser); // * Completed

apiRouter.get("/session-details/:id", setSessionDetails, sendSessionDetails); // ! wait until I finish || this is the overlay session details

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

apiRouter.get("/active-session", async (req, res) => {
  const result = await getActiveSession(req.user.uid);
  console.log("active session result", result);
  
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
  const result = await changeTaskState(status, taskId);
  console.log(result);
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
}); // * should test

apiRouter.post("/create-session", async (req, res) => {
  const sessionData = req.body.sessionData;
  console.log("sessionDATa", sessionData);

  const result = await createGroupSession(sessionData, req.user.uid);

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
}); // * should test

// Accept a join request by userId and groupId
apiRouter.post("/accept-demande", async (req, res) => {
  console.log(req.body, "body");
  const { demandeId, groupId } = req.body;
  const result = await acceptRequest(groupId, demandeId, req.user.uid);
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
}); // ! should implement with firebase

// Reject a join request by userId and groupId
apiRouter.post("/reject-demande", async (req, res) => {
  const { demandeId, groupId } = req.body;
  // TODO: Implement rejectDemande logic
  const result = await rejectRequest(groupId, demandeId, req.user.uid);
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
}); // ! should implement with firebase

// Join a session by sessionId
apiRouter.post("/join-session/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const result = await joinSession(sessionId, req.user);
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
});

// Remove a group by groupId
apiRouter.delete("/remove-group/:groupId", async (req, res) => {
  const { groupId } = req.params;
  const result = await deleteGroup(groupId);
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
}); // ! should implement with firebase

// Leave a group by userId and groupId
apiRouter.post("/leave-group", async (req, res) => {
  const { groupId } = req.body;
  const result = await quitterGroup(groupId, req.user.uid);

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
}); // ! should implement with firebase

// Add members to a group by userId(s) and groupId
apiRouter.post("/add-member", async (req, res) => {
  const { memberId, groupId } = req.body; // !! check the userId
  const result = await ajouterMembre(groupId, memberId);
  // TODO: Implement addMembers logic

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
}); // ! should implement with firebase

// Kick a member from a group by groupId and userId
apiRouter.post("/kick-member", async (req, res) => {
  const { groupId, memberId } = req.body;
  const result = await kickMember(groupId, memberId);
  // TODO: Implement kickMember logic

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
}); // ! should implement with firebase

// Transfer role in a group by groupId, fromUserId, toUserId
apiRouter.post("/transfer-role", async (req, res) => {
  const { groupId, memberId } = req.body;
  const result = await modifieGroupPropertie(groupId, "creator", memberId);
  // TODO: Implement transferRole logic

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
}); // ! should implement with firebase

// End a session by sessionId
apiRouter.post("/end-session/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const result = await annulerSession(sessionId);
  // TODO: Implement endSession logic

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
});

// Leave a session by sessionId and userId
apiRouter.post("/leave-session", async (req, res) => {
  const { sessionId, userId } = req.body;
  const result = await leavSession(userId, sessionId);

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
});

// Get examen result by userId and quizId
apiRouter.get("/examen-result", async (req, res) => {
  const { userId, quizId } = req.query;

  const result = {
    success: true,
    message: "Examen result",
  };
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
});

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
