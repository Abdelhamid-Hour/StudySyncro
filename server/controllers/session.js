const { db } = require("../firebase/firebaseAdmin");
const {
  getActiveSession,
  createGroupSession,
  joinSession,
  cancelSession,
  leavSession,
  fetchActiveSessions,
  formatSessions,
} = require("../utils/firebase-utils/session");

const { changeTaskStatus } = require("../utils/firebase-utils/tache");
const { formatHoursMinutes, millisecondsToHMFormat } = require("../utils/global");

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

  if (result.success) {
    return res.status(200).json({ ...result.sessionData });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
};

const getActiveSessionsHandler = async (req, res) => {
  const { lastVisible, count, search } = req.query;

  const result = await fetchActiveSessions(
    req.user.uid,
    Number(count),
    lastVisible,
    { search }
  );
  

  if (result.success) {
    return res
      .status(200)
      .json({ cards: result.sessions, lastVisible: result.lastVisible });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
};

const updateTaskStatusHandler = async (req, res) => {
  const { taskId, status } = req.body;
  const result = await changeTaskStatus(status, taskId);
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
};

// send lastQueryTime

const sessionStreamHandler = async (req, res) => {  
  const { lastQueryTime } = req.query;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders && res.flushHeaders(); // flush the headers to establish SSE with client

  const userId = req.user.uid;

  // Build the query against the fan-out subcollection without startDate filter
  // Why? If we filter by startDate > lastQueryTime, any existing session created before page load
  // is ignored by Firestore, so modifications (like joinedCount updating) or removals are never received!
  const query = db.collection("users").doc(userId).collection("activeSessions");

  const unSubscribe = query.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const sessionData = change.doc.data();
      const sessionId = change.doc.id;
      
      const startTimeVal = sessionData.startDate;
      const endTimeVal = startTimeVal ? new Date(startTimeVal).getTime() + (sessionData.duration || 0) * 60 * 1000 : null;

      // We manually construct the session object so it perfectly matches the client model
      const session = {
        ...sessionData,
        id: sessionId,
        duration: millisecondsToHMFormat((sessionData.duration || 0) * 60 * 1000),
        startTime: startTimeVal ? formatHoursMinutes(startTimeVal) : "N/A",
        endTime: endTimeVal ? formatHoursMinutes(endTimeVal) : "N/A",
      };
      
      if (change.type === "added") {
        // Only send 'added' if the session started AFTER lastQueryTime to avoid duplicates of initial lazy-loaded sessions
        if (!lastQueryTime || new Date(sessionData.startDate) > new Date(lastQueryTime)) {
          res.write(`data: ${JSON.stringify({ newSession: session })}\n\n`);
        } else {
        }
      } else if (change.type === "modified") {
        res.write(`data: ${JSON.stringify({ modifiedSession: session })}\n\n`);
      } else if (change.type === "removed") {
        res.write(`data: ${JSON.stringify({ removedSession: sessionId })}\n\n`);
      }
    });
  }, (error) => {
    console.error("Error in session stream:", error);
    res.end();
  });

  const heartbeat = setInterval(() => {
    try {
      res.write(":\n\n");
    } catch (e) {
      console.log("error in hear: ", e);
      
      clearInterval(heartbeat);
      unSubscribe();
      res.end();
    }
  }, 20 * 1000);

  req.on("close", () => {
    try {      
      clearInterval(heartbeat);
      unSubscribe();
      res.end();
    } catch (error) {
      console.warn("Error closing stream:", error);
    }
  });
};

const streamSingleSessionHandler = async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: "sessionId required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders && res.flushHeaders();

  const sessionRef = db.collection("sessions").doc(sessionId);
  const unSubscribe = sessionRef.onSnapshot((docSnap) => {
    if (docSnap.exists) {
      
      const data = docSnap.data();
      res.write(`data: ${JSON.stringify({ joinedCount: data.joinedCount || 0, status: data.status })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ removed: true })}\n\n`);
    }
  }, (error) => {
    console.error("Error streaming single session:", error);
    res.end();
  });

  const heartbeat = setInterval(() => {
    try {
      res.write(":\n\n");
    } catch (e) {
      clearInterval(heartbeat);
      unSubscribe();
      res.end();
    }
  }, 20000);

  req.on("close", () => {
    try {
      clearInterval(heartbeat);
      unSubscribe();
      res.end();
    } catch (error) {
      console.warn("Error closing single session stream:", error);
    }
  });
};

module.exports = {
  leaveSessionHandler,
  endSessionHandler,
  joinSessionHandler,
  createSessionHandler,
  getActiveSessionHandler,
  getActiveSessionsHandler,
  updateTaskStatusHandler,
  sessionStreamHandler,
  streamSingleSessionHandler,
};
