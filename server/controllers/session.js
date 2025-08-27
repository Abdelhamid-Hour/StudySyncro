const {
  getActiveSession,
  createGroupSession,
  joinSession,
  cancelSession,
  leavSession,
} = require("../utils/firebase-utils/session");
const { changeTaskStatus } = require("../utils/firebase-utils/tache");

const leaveSessionHandler = async (req, res) => {
  const { sessionId } = req.body;
  const result = await leavSession(req.user.uid, sessionId);

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
};

const endSessionHandler = async (req, res) => {
  const { sessionId } = req.body;
  const result = await cancelSession(sessionId);

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
};

const joinSessionHandler = async (req, res) => {
  const { sessionId } = req.body;
  const result = await joinSession(sessionId, req.user.uid);
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
};

const createSessionHandler = async (req, res) => {
  const sessionData = req.body.sessionData;

  const result = await createGroupSession(sessionData, req.user.uid);

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
};

const getActiveSessionHandler = async (req, res) => {
  const result = await getActiveSession(req.user.uid);

  console.log("active session result", result);

  if (result.success) {
    return res.status(200).json({ ...result.sessionData });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
};

const updateTaskStatusHandler = async (req, res) => {
  const { taskId, status } = req.body;
  const result = await changeTaskStatus(status, taskId);
  console.log(result);
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
};

module.exports = {
  leaveSessionHandler,
  endSessionHandler,
  joinSessionHandler,
  createSessionHandler,
  getActiveSessionHandler,
  updateTaskStatusHandler,
};
