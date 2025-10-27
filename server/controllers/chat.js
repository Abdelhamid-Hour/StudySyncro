const {
  sendMessage,
  roomStreamExists,
  startChildAddedListener,
  getMessages,
  CHAT_STREAM_MAP,
} = require("../utils/firebase-utils/chat");
const { rDb, db } = require("../firebase/firebaseAdmin");

const cleanupClient = (res, userId) => {
  const userStream = CHAT_STREAM_MAP.get(res.streamKey || streamKey);
  if (userStream) {
    userStream.resMap.delete(userId);
    if (userStream.resMap.size === 0) {
      CHAT_STREAM_MAP.delete(res.streamKey || streamKey);
    }
    userStream.query.off("child_added", userStream.listener);
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
    req.user
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
  console.log("WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW");
  
  const groupId = req.query.groupId;
  const sessionId = req.query.sessionId;
  const lastMessageId = req.query.lastMessageId || "";

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
  const streamKey = `${roomId}-${lastMessageId}`;
  const roomAlreadyExists = roomStreamExists(roomId);
  const path = sessionId ? `sessions/${roomId}/chat` : `groups/${roomId}/chat`;
  const query = lastMessageId
    ? rDb.ref(path).orderByKey().startAfter(lastMessageId)
    : rDb.ref(path).orderByKey();
  if (CHAT_STREAM_MAP.has(streamKey)) {
    const existingStream = CHAT_STREAM_MAP.get(streamKey);
    existingStream.resMap.set(req.user.uid, res);
  } else if (roomAlreadyExists) {
    CHAT_STREAM_MAP.set(streamKey, {
      resMap: new Map(),
      query: null,
      listener: null,
    });
    CHAT_STREAM_MAP.get(streamKey).resMap.set(req.user.uid, res);
    startChildAddedListener(true, roomId, lastMessageId, query, req.user.uid);
  } else {
    CHAT_STREAM_MAP.set(streamKey, {
      resMap: new Map(),
      query: null,
      listener: null,
    });
    CHAT_STREAM_MAP.get(streamKey).resMap.set(req.user.uid, res);
    startChildAddedListener(false, roomId, lastMessageId, query, req.user.uid);
  }

  const heartbeat = setInterval(() => {
    try {
      res.write(":\n\n");
    } catch (e) {
      clearInterval(heartbeat);
      cleanupClient(res, req.user.uid);
    }
  }, 20 * 1000);

  req.on("close", () => {
    try {
      clearInterval(heartbeat);
      cleanupClient(res, req.user.uid);
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
    lastVisible
  );

  console.log("Get messages result:", result.messages);

  if (result.success) {
    return res.status(200).json({
      cards: result.messages.length ? [result.messages] : [],
      lastVisible: result.lastVisible,
    });
  } else {
    return res.status(400).json({ message: result.message });
  }
};

module.exports = {
  sendMessageHandler,
  getMessagesHandler,
  chatStreamHandler,
};
