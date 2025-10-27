const { rDb, db } = require("../../firebase/firebaseAdmin");
const { INITIALE_LOADERS_COUNT } = require("../global");
const { uploadFileToStorage } = require("./shared");

const CHAT_STREAM_MAP = new Map();

const FILE_STATUS = {
  UPLOADING: "uploading",
  UPLOADED: "uploaded",
  FAILED: "failed",
};

const sendMessage = async (
  file,
  message,
  messageId,
  sessionId,
  localId,
  groupId,
  timestamp,
  user
) => {
  try {
    const joinedToGroup = await db
      .collection("users")
      .doc(user.uid)
      .collection("userGroupsIds")
      .doc(groupId)
      .get();

    if (!joinedToGroup.exists)
      throw new Error("You Are Unauthorized to send message to this group");

    if (sessionId && user.currentSession !== sessionId) {
      throw new Error("You Are Unauthorized to send message to this session");
    }

    const chatPath = sessionId
      ? `sessions/${sessionId}/chat`
      : `groups/${groupId}/chat`;
    const ref = rDb.ref(chatPath);

    const messageData = {
      sender: {
        id: user.uid,
        fullName: user.fullName,
        photoURL: user.photoURL,
      },
      timestamp: Number(timestamp) || Date.now(),
      content: {},
      localId,
    };

    if (messageId) {
      const msg = await ref.child(messageId).get();
      if (!msg.exists())
        return { success: false, message: "Message not found", messageId };
      if (msg.val().sender.id !== user.uid)
        return {
          success: false,
          message: "Unauthorized to edit this message",
        };
    }

    if (message) {
      messageData.content.text = message;
      messageData.timestamp = Date.now();
      const chatRef = await ref.push(messageData);

      return {
        success: true,
        data: {
          messageId: chatRef.key,
        },
      };
    }

    messageData.content.filePath = "";
    messageData.content.fileName =
      file.originalname || file.name || "unknown_filename";
    messageData.content.fileType = file.mimetype;
    messageData.content.fileStatus = FILE_STATUS.UPLOADING;
    messageData.content.size = file.size || 0;
    let chatRef = messageId
      ? ref.child(messageId)
      : await ref.push(messageData);
    const filePath = sessionId
      ? `chats/sessions/${sessionId}/${chatRef.key}`
      : `chats/groups/${groupId}/${chatRef.key}`;
    const res = await uploadFileToStorage(filePath, file);
    if (!res.success) {
      await chatRef.child("content").update({ fileStatus: FILE_STATUS.FAILED });
      return { success: false, messageId: chatRef.key, message: res.message };
    }
    await chatRef.remove();
    messageData.content.filePath = res.URL;
    messageData.content.fileStatus = FILE_STATUS.UPLOADED;
    messageData.timestamp = Date.now();

    chatRef = await ref.push(messageData);
    return {
      success: true,
      data: {
        filePath: res.URL,
        messageId: chatRef.key,
      },
    };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, message: error.message };
  }
};

const getFormatedMessages = (messages, userId) => {
  return Object.entries(messages || {})
    .map(([key, { localId, ...msg }]) => {
      const formatedMsg = {
        id: key,
        isSender: msg.sender.id === userId,
        ...msg,
      };

      if (msg.sender.id === userId) {
        formatedMsg.localId = localId;
      }
      formatedMsg.sender.id =
        formatedMsg.sender.id === userId ? "self" : formatedMsg.sender.id;

      return formatedMsg;
    })
    .filter(
      (msg) =>
        !(
          !msg.isSender &&
          msg.content.fileStatus &&
          msg.content.fileStatus !== FILE_STATUS.UPLOADED
        )
    );
};

const getMessages = async (
  sessionId,
  groupId,
  userId,
  limit = INITIALE_LOADERS_COUNT,
  lastVisible = null
) => {
  try {
    const chatPath = sessionId
      ? `sessions/${sessionId}/chat`
      : `groups/${groupId}/chat`;

    let messages = [];
    limit = limit + 1;

    do {
      let ref = rDb.ref(chatPath).orderByKey().limitToLast(limit);
      if (lastVisible) {
        ref = rDb.ref(chatPath + `/${lastVisible}`);
        const snapshot = await ref.once("value");
        if (!snapshot.exists()) {
          lastVisible = null;
          break;
        } // lastVisible not found
        ref = rDb
          .ref(chatPath)
          .orderByKey()
          .endAt(lastVisible)
          .limitToLast(limit);
      }

      const snapshot = await ref.once("value");

      messages = getFormatedMessages(snapshot.val(), userId)
        .slice(-(limit - messages.length))
        .concat(messages);

      lastVisible =
        snapshot.exists() && Object.keys(snapshot.val()).length === limit
          ? Object.keys(snapshot.val())[0]
          : null;
    } while (messages.length < limit && lastVisible);

    lastVisible = messages.length === limit ? messages[0].id : null;

    if (messages.length === limit) messages.shift(); // remove the extra one used for checking more messages

    return { success: true, messages, lastVisible };
  } catch (error) {
    console.error("Error getting messages:", error);
    return { success: false, message: error.message };
  }
};

const roomStreamExists = (roomId) => {
  return Array.from(CHAT_STREAM_MAP.keys()).some((k) => k.startsWith(roomId));
};

const startChildAddedListener = (
  roomAlreadyExists,
  roomId,
  lastMessageId,
  query
) => {
  const onChildAdded = (snapshot) => {
    try {
      const messageData = {
        id: snapshot.key,
        ...snapshot.val(),
      };
      if (messageData.content.fileStatus === FILE_STATUS.UPLOADING) return; // skip messages that are still uploading
      const newStreamKey = `${roomId}-${messageData.id}`;
      const prevStreamKey = `${roomId}-${lastMessageId}`;
      lastMessageId = messageData.id;
      const existingStream = CHAT_STREAM_MAP.get(newStreamKey);
      const oldStream = CHAT_STREAM_MAP.get(prevStreamKey);

      if (!oldStream) {
        try {
          return query.off("child_added", onChildAdded);
        } catch (error) {
          return console.warn("Error detaching listener:", error);
        }
      }

      if (roomAlreadyExists && existingStream) {
        // add users res objs to existing stream
        const stream = CHAT_STREAM_MAP.get(prevStreamKey);
        stream.resMap.forEach((res, userId) => {
          existingStream.resMap.set(userId, res);
        });
        // delete old stream
        CHAT_STREAM_MAP.delete(prevStreamKey);
        try {
          query.off("child_added", onChildAdded);
        } catch (error) {
          console.warn("Error detaching listener:", error);
        }
        return broadcastMessage(oldStream.resMap, newStreamKey, messageData);
      }

      CHAT_STREAM_MAP.delete(prevStreamKey);
      CHAT_STREAM_MAP.set(newStreamKey, oldStream);

      return broadcastMessage(oldStream.resMap, newStreamKey, messageData);
    } catch (error) {
      console.error("Error in onChildAdded:", error);
      const errEntry = CHAT_STREAM_MAP.get(`${roomId}-${lastMessageId}`);
      if (errEntry)
        broadcastMessage(
          errEntry.resMap,
          `${roomId}-${lastMessageId}`,
          { message: "Server error" },
          true
        );
      try {
        query.off("child_added", onChildAdded);
      } catch (e) {
        console.warn("Error detaching listener after onChildAdded error:", e);
      }
      CHAT_STREAM_MAP.delete(`${roomId}-${lastMessageId}`);
    }
  };
  const streamKey = `${roomId}-${lastMessageId}`;
  const entry = CHAT_STREAM_MAP.get(streamKey);
  if (!entry) {
    console.warn("No stream entry found when starting listener for", streamKey);
    // optionally create it or return
    return;
  }
  entry.listener = onChildAdded;
  entry.query = query;
  query.on("child_added", onChildAdded, (errorObject) => {
    console.error("Firebase listener error:", errorObject);
    const streamKey = `${roomId}-${lastMessageId}`;
    broadcastMessage(
      CHAT_STREAM_MAP.get(streamKey).resMap,
      streamKey,
      null,
      true
    );
  });
};

const broadcastMessage = (resMap, streamKey, messageData, error = false) => {
  if (!resMap) return;
  resMap.forEach((res, userId) => {
    try {
      if (streamKey) res.streamKey = streamKey;
      if (messageData && messageData.sender.id === userId) return; // don't send the message to the sender
      res.write(`event: ${error ? "error" : "message"}\n`);
      res.write(
        `data: ${JSON.stringify(
          error ? { message: "DB listener error" } : messageData
        )}\n\n`
      );
    } catch (err) {
      // broken socket — remove it and continue
      console.warn(
        `Failed to write to client ${userId}; removing connection:`,
        err
      );
      try {
        res.end();
      } catch (e) {
        console.warn("Error ending response in broadcastMessage error:", e);
      }
      resMap.delete(userId);
    }
  });
};

module.exports = {
  sendMessage,
  getMessages,
  roomStreamExists,
  startChildAddedListener,
  CHAT_STREAM_MAP,
};
