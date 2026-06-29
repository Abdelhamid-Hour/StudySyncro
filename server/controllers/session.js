const { db } = require("../firebase/firebaseAdmin");
const {
  getActiveSession,
  createGroupSession,
  joinSession,
  cancelSession,
  leavSession,
  fetchActiveSessions,
  formatSessions,
  SESSION_STREAM_MAP,
  LAST_VISIBLE_SESSION_MAP,
} = require("../utils/firebase-utils/session");

const { changeTaskStatus } = require("../utils/firebase-utils/tache");

let unSubscribe = null;
const lastSentSession = "";

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

const getActiveSessionsHandler = async (req, res) => {
  const { lastVisible, count } = req.query;

  const result = await fetchActiveSessions(
    req.user.uid,
    Number(count),
    lastVisible
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
  console.log(result);
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
  const { lastQueryTime, lastNewSession } = req.query;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders && res.flushHeaders(); // flush the headers to establish SSE with client

  const userId = req.user.uid;
  const joinedGroupsIdsSnap = await db
    .collection("users")
    .doc(userId)
    .collection("userGroupsIds")
    .get();
  const joinedGroupsIds = joinedGroupsIdsSnap.empty
    ? []
    : joinedGroupsIdsSnap.docs.map((doc) => doc.id);

  const lastVisibleSession = LAST_VISIBLE_SESSION_MAP.get(userId) || null;

  const missedUpdatedSessionsSnap = lastVisibleSession
    ? await db
        .collection("sessions")
        .where("groupId", "in", joinedGroupsIds)
        .where("updatedAt", ">=", Number(lastQueryTime))
        .orderBy(db.FieldPath.documentId(), "asc")
        .startAfter(lastVisibleSession)
        .get()
    : null;

  if (missedUpdatedSessionsSnap && !missedUpdatedSessionsSnap.empty) {
    const missedUpdatedSessions = missedUpdatedSessionsSnap.docs.map(
      (doc) => doc.id
    );
    res.write(
      `data: ${JSON.stringify({ updatedSessions: missedUpdatedSessions })}\n\n`
    );
  }

  if (lastNewSession && lastNewSession !== lastSentSession) {
    const missedNewSessionsSnap = lastSentSession
      ? await db
          .collection("sessions")
          .where("groupId", "in", joinedGroupsIds)
          .orderBy(db.FieldPath.documentId(), "asc") // order from the old to the new
          .startAfter(lastNewSession)
          .endAt(lastSentSession)
          .get()
      : await db
          .collection("sessions")
          .where("groupId", "in", joinedGroupsIds)
          .orderBy(db.FieldPath.documentId(), "asc")
          .startAfter(lastNewSession)
          .get();

    if (!missedNewSessionsSnap.empty) {
      const missedNewSessions = formatSessions(missedNewSessionsSnap.docs);
      res.write(
        `data: ${JSON.stringify({ newSessions: missedNewSessions })}\n\n`
      );
    }
  }

  SESSION_STREAM_MAP.set(userId, {
    res,
    groupIds: new Set(joinedGroupsIds),
    lastVisible: lastVisibleSession,
  });

  LAST_VISIBLE_SESSION_MAP.delete(userId);

  if (SESSION_STREAM_MAP.size === 1) {
    const query = db
      .collection("sessions")
      .orderBy(db.FieldPath.documentId(), "asc")
      .startAfter(lastNewSession || "");
    unSubscribe = query.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          for (const [_, client] of SESSION_STREAM_MAP) {
            if (client.groupIds.has(change.doc.data().groupId)) {
              const newSession = formatSessions([change.doc])[0];
              client.res.write(
                `data: ${JSON.stringify({ newSession: newSession })}\n\n`
              );
              lastSentSession = change.doc.id;
            }
          }
        }

        if (
          change.type === "modified" &&
          change.doc.data().status !== "active"
        ) {
          for (const [_, client] of SESSION_STREAM_MAP) {
            if (
              client.groupIds.has(change.doc.data().groupId) &&
              client.lastVisible &&
              change.doc.id >= client.lastVisible // only send modified sessions that are after the client's last visible session
            ) {
              client.res.write(
                `data: ${JSON.stringify({
                  modifiedSession: change.doc.id,
                })}\n\n`
              );
            }
          }
        }
      });
    });
  }

  const heartbeat = setInterval(() => {
    try {
      res.write(":\n\n");
    } catch (e) {
      clearInterval(heartbeat);
      cleanupClient(res, userId);
    }
  }, 20 * 1000);

  req.on("close", () => {
    try {
      clearInterval(heartbeat);
      SESSION_STREAM_MAP.delete(userId);
      if (SESSION_STREAM_MAP.size === 0) {
        unSubscribe && unSubscribe();
        LAST_VISIBLE_SESSION_MAP.clear();
      }
      res.end();
    } catch (error) {
      console.warn("Error closing stream:", error);
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
};
