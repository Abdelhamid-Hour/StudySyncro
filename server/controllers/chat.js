const {
  sendMessage,
  startChildAddedListener,
  getMessages,
  STREAM_MAP,
  markGroupAsReadHelper,
  getUserGroupChatStateHelper,
  getRecentMessagesHelper,
  startRecentMessagesListener,
  RECENT_MESSAGES_STREAM_MAP,
} = require("../utils/firebase-utils/chat");
const { rDb, db } = require("../firebase/firebaseAdmin");

const cleanUpClient = (res, userId) => {
  const userStream = STREAM_MAP.get(res.roomId);
  if (userStream) {
    userStream.resMap.delete(userId);
    if (userStream.resMap.size === 0) {
      STREAM_MAP.delete(res.roomId);
      userStream.query.off("child_added", userStream.listener);
    }
  }
  res.end();
};

const sendMessageHandler = async (req, res) => {
  const file = req.file;

  const { sessionId, groupId, timestamp, localId } = req.body;
  const message = req.body.message || "";
  const messageId = req.body.messageId || null;

  const result = await sendMessage(
    file,
    message,
    messageId,
    sessionId,
    localId,
    groupId,
    timestamp,
    req.user,
  );

  if (result.success) {
    return res
      .status(200)
      .json({ message: "Message sent successfully", ...result.data });
  }
  return res.status(500).json({
    message: result.message || "Failed to send message",
    messageId: result.messageId,
  });
};

const chatStreamHandler = async (req, res) => {
  
  const groupId = req.query.groupId;
  const sessionId = req.query.sessionId;
  const groupSnap = await db.collection("groups").doc(groupId).get();

  if (!groupSnap.exists)
    return res.status(404).json({ error: "Group not found" });

  const joinedToGroup = await db
    .collection("users")
    .doc(req.user.uid)
    .collection("userGroupsIds")
    .doc(groupId)
    .get();

  if (!joinedToGroup.exists)
    return res.status(403).json({ error: "Access denied to this group chat" });

  if (sessionId && req.user.currentSession !== sessionId)
    return res
      .status(403)
      .json({ error: "Access denied to this session chat" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders && res.flushHeaders(); // flush the headers to establish SSE with client
  const roomId = sessionId || groupId;
  const path = sessionId ? `sessions/${roomId}/chat` : `groups/${roomId}/chat`;
  const timestamp = Date.now();
  const query = rDb.ref(path).orderByChild("timestamp").startAt(timestamp);
  if (STREAM_MAP.has(roomId)) {
    STREAM_MAP.get(roomId).resMap.set(req.user.uid, res);
  } else {
    STREAM_MAP.set(roomId, {
      resMap: new Map(),
      query: null,
      listener: null,
    });
    STREAM_MAP.get(roomId).resMap.set(req.user.uid, res);
    startChildAddedListener(roomId, query);
  }

  const heartbeat = setInterval(() => {
    try {
      res.write(":\n\n");
    } catch (e) {
      clearInterval(heartbeat);
      cleanUpClient(res, req.user.uid);
    }
  }, 20 * 1000);

  req.on("close", () => {
    try {
      clearInterval(heartbeat);
      cleanUpClient(res, req.user.uid)
    } catch (error) {
      console.warn("Error closing stream:", error);
    }
  });
};

const getMessagesHandler = async (req, res) => {
  const { groupId, sessionId, count, lastVisible } = req.query;

  const result = await getMessages(
    sessionId,
    groupId,
    req.user.uid,
    Number(count),
    lastVisible,
  );

  if (result.success) {
    return res.status(200).json({
      cards: result.messages.length ? [result.messages] : [[]],
      lastVisible: result.lastVisible,
    });
  } else {
    return res.status(400).json({ message: result.message });
  }
};

const cleanUpRecentMessagesClient = (res, userId) => {
  const streamEntry = RECENT_MESSAGES_STREAM_MAP.get(userId);
  if (streamEntry) {
    if (streamEntry.query) {
      try {
        if (streamEntry.listener) {
          streamEntry.query.off("child_added", streamEntry.listener);
          streamEntry.query.off("child_changed", streamEntry.listener);
        }
        if (streamEntry.removedListener) {
          streamEntry.query.off("child_removed", streamEntry.removedListener);
        }
      } catch (e) {}
    }
    RECENT_MESSAGES_STREAM_MAP.delete(userId);
  }
  try {
    res.end();
  } catch (e) {}
};

const markGroupAsReadHandler = async (req, res) => {
  const { groupId, messageId, timestamp } = req.body;
  if (!groupId) return res.status(400).json({ message: "groupId is required" });
  const result = await markGroupAsReadHelper(req.user.uid, groupId, messageId, timestamp);
  if (result.success) {
    return res.status(200).json({ message: "Marked as read" });
  }
  return res
    .status(500)
    .json({ message: result.message || "Failed to mark as read" });
};

const getUserGroupChatStateHandler = async (req, res) => {
  const { groupId } = req.params;
  if (!groupId) return res.status(400).json({ message: "groupId is required" });
  const result = await getUserGroupChatStateHelper(req.user.uid, groupId);
  if (result.success) {
    return res.status(200).json(result.data);
  }
  return res
    .status(500)
    .json({ message: result.message || "Failed to get state" });
};

const getRecentMessagesHandler = async (req, res) => {
  const { limit = 10, lastVisible = null } = req.query;
  const result = await getRecentMessagesHelper(
    req.user.uid,
    Number(limit),
    lastVisible,
  );
  if (result.success) {
    return res.status(200).json({
      cards: result.data.cards,
      lastVisible: result.data.lastVisible,
    });
  }
  return res.status(500).json({ message: result.message });
};

const recentMessagesStreamHandler = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders && res.flushHeaders();

  const userId = req.user.uid;
  const path = `userGroupChats/${userId}`;
  const query = rDb.ref(path).orderByChild("lastUpdate");

  if (RECENT_MESSAGES_STREAM_MAP.has(userId)) {
    cleanUpRecentMessagesClient(
      RECENT_MESSAGES_STREAM_MAP.get(userId).res,
      userId,
    );
  }

  RECENT_MESSAGES_STREAM_MAP.set(userId, {
    res,
    query: null,
    listener: null,
  });

  startRecentMessagesListener(userId, query);

  const heartbeat = setInterval(() => {
    try {
      res.write(":\n\n");
    } catch (e) {
      clearInterval(heartbeat);
      cleanUpRecentMessagesClient(res, userId);
    }
  }, 20 * 1000);

  req.on("close", () => {
    try {
      clearInterval(heartbeat);
      cleanUpRecentMessagesClient(res, userId);
    } catch (error) {
      console.warn("Error closing recent messages stream:", error);
    }
  });
};

module.exports = {
  sendMessageHandler,
  getMessagesHandler,
  chatStreamHandler,
  markGroupAsReadHandler,
  getUserGroupChatStateHandler,
  getRecentMessagesHandler,
  recentMessagesStreamHandler,
};
