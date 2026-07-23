const { rDb, db } = require("../../firebase/firebaseAdmin");
const { INITIALE_LOADERS_COUNT } = require("../global");
const { uploadFileToStorage } = require("./shared");

const STREAM_MAP = new Map();

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
  user,
) => {
  try {
    if (
      !file &&
      (!message || typeof message !== "string" || message.trim().length === 0)
    ) {
      throw new Error("Cannot send an empty message without an attachment.");
    }

    const joinedToGroup = await db
      .collection("users")
      .doc(user.uid)
      .collection("userGroups")
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
        return {
          success: false,
          message: "Message not found",
          messageId,
          isNative: false,
          type: "error",
        };
      if (msg.val().sender.id !== user.uid)
        return {
          success: false,
          message: "Unauthorized to edit this message",
          isNative: true,
          type: "warning",
        };
    }

    if (message) {
      messageData.content.text = message;
      const chatRef = await ref.push(messageData);

      if (!sessionId && groupId) {
        await updateUserGroupChatState(groupId, messageData, chatRef.key);
      }

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
      return {
        success: false,
        messageId: chatRef.key,
        message: res.message,
        isNative: res.isNative ?? false,
        type: res.type ?? "error",
      };
    }
    await chatRef.remove();
    messageData.content.filePath = res.URL;
    messageData.content.fileStatus = FILE_STATUS.UPLOADED;
    messageData.timestamp = Date.now();

    chatRef = await ref.push(messageData);
    if (!sessionId && groupId) {
      await updateUserGroupChatState(groupId, messageData, chatRef.key);
    }
    return {
      success: true,
      data: {
        filePath: res.URL,
        messageId: chatRef.key,
      },
    };
  } catch (error) {
    console.error("Error sending message:", error);
    const isValidation = [
      "Cannot send an empty message without an attachment.",
      "You Are Unauthorized to send message to this group",
      "You Are Unauthorized to send message to this session",
    ].includes(error.message);
    return {
      success: false,
      message: error.message,
      isNative: isValidation,
      type: isValidation ? "warning" : "error",
    };
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
        ),
    );
};

const getMessages = async (
  sessionId,
  groupId,
  userId,
  limit = INITIALE_LOADERS_COUNT,
  lastVisible = null,
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
    return {
      success: false,
      message: error.message,
      isNative: false,
      type: "error",
    };
  }
};

const startChildAddedListener = (roomId, query) => {
  const onChildAdded = (snapshot) => {
    try {
      const messageData = {
        id: snapshot.key,
        ...snapshot.val(),
      };

      if (messageData.content.fileStatus === FILE_STATUS.UPLOADING) return; // skip messages that are still uploading

      return broadcastMessage(roomId, messageData);
    } catch (error) {
      console.error("Error in onChildAdded:", error);
      const errEntry = STREAM_MAP.get(roomId);
      if (errEntry) broadcastMessage(roomId, { message: "Server error" }, true);
      try {
        query.off("child_added", onChildAdded);
      } catch (e) {
        console.warn("Error detaching listener after onChildAdded error:", e);
      }
      STREAM_MAP.delete(roomId);
    }
  };
  const entry = STREAM_MAP.get(roomId);
  if (!entry) {
    console.warn("No stream entry found when starting listener for", roomId);
    // optionally create it or return
    return;
  }
  entry.listener = onChildAdded;
  entry.query = query;
  query.on("child_added", onChildAdded, (errorObject) => {
    console.error("Firebase listener error:", errorObject);
    broadcastMessage(roomId, null, true);
  });
};

const broadcastMessage = (roomId, messageData, error = false) => {
  const streamEntry = STREAM_MAP.get(roomId);
  if (!streamEntry) {
    console.warn("No stream entry found for broadcasting message:", roomId);
    return;
  }
  const resMap = streamEntry.resMap;
  if (!resMap) return;
  resMap.forEach((res, userId) => {
    try {
      res.roomId = roomId;
      if (messageData && messageData.sender.id === userId) return; // don't send the message to the sender
      res.write(`event: ${error ? "error" : "message"}\n`);
      res.write(
        `data: ${JSON.stringify(
          error ? { message: "DB listener error" } : messageData,
        )}\n\n`,
      );
    } catch (err) {
      // broken socket — remove it and continue
      console.warn(
        `Failed to write to client ${userId}; removing connection:`,
        err,
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

const updateUserGroupChatState = async (groupId, messageData, messageId) => {
  try {
    const groupDoc = await db.collection("groups").doc(groupId).get();
    if (!groupDoc.exists) return;
    const groupData = groupDoc.data();
    const groupName = groupData.name || "Study Group";
    const membersSnap = await groupDoc.ref.collection("members").get();

    const now = Date.now();
    const text =
      messageData.content.text ||
      (messageData.content.fileName
        ? "Attachment: " + messageData.content.fileName
        : "Sent a message");
    const senderName = messageData.sender.fullName || "User";
    const senderId = messageData.sender.id;
    const senderPhotoURL = messageData.sender.photoURL || null;

    const updates = {};
    for (const doc of membersSnap.docs) {
      const memberId = doc.id;
      const refPath = `userGroupChats/${memberId}/${groupId}`;

      if (memberId === senderId) {
        updates[refPath] = {
          groupId,
          groupName,
          lastUpdate: now,
          lastMessage: {
            id: messageId,
            text,
            senderName,
            senderId,
            senderPhotoURL,
            timestamp: now,
          },
          unreadCount: 0,
          hasUnreadMessages: false,
        };
      } else {
        const userGroupRef = rDb.ref(refPath);
        const snapshot = await userGroupRef.once("value");
        const currentData = snapshot.val() || {};
        const currentUnread = (currentData.unreadCount || 0) + 1;

        updates[refPath] = {
          groupId,
          groupName,
          lastUpdate: now,
          lastMessage: {
            id: messageId,
            text,
            senderName,
            senderId,
            senderPhotoURL,
            timestamp: now,
          },
          unreadCount: currentUnread,
          hasUnreadMessages: currentUnread > 0,
          lastSeenTimestamp: currentData.lastSeenTimestamp || 0,
          lastSeenMessageId: currentData.lastSeenMessageId || null,
        };
      }
    }
    await rDb.ref().update(updates);
  } catch (error) {
    console.error("Error updating userGroupChatState:", error);
  }
};

const markGroupAsReadHelper = async (
  userId,
  groupId,
  messageId = null,
  timestamp = null,
) => {
  try {
    const ref = rDb.ref(`userGroupChats/${userId}/${groupId}`);
    const snap = await ref.once("value");
    if (!snap.exists()) {
      return {
        success: false,
        message: "Group chat state not found",
        isNative: true,
        type: "info",
      };
    }
    const now = Date.now();
    const updates = {
      unreadCount: 0,
      hasUnreadMessages: false,
      lastSeenTimestamp: timestamp || now,
    };
    if (messageId) {
      updates.lastSeenMessageId = messageId;
    }
    await ref.update(updates);
    return { success: true };
  } catch (error) {
    console.error("Error marking group as read:", error);
    return {
      success: false,
      message: error.message,
      isNative: false,
      type: "error",
    };
  }
};

const getUserGroupChatStateHelper = async (userId, groupId) => {
  try {
    const ref = rDb.ref(`userGroupChats/${userId}/${groupId}`);
    const snap = await ref.once("value");
    if (!snap.exists()) {
      return {
        success: false,
        message: "Group chat state not found",
        isNative: true,
        type: "info",
      };
    }
    return { success: true, data: snap.val() };
  } catch (error) {
    console.error("Error getting user group chat state:", error);
    return {
      success: false,
      message: error.message,
      isNative: false,
      type: "error",
    };
  }
};

const getRecentMessagesHelper = async (
  userId,
  limit = INITIALE_LOADERS_COUNT,
  lastVisible = null,
) => {
  try {
    const baseRef = rDb.ref(`userGroupChats/${userId}`);
    let query = baseRef.orderByChild("lastUpdate");

    if (lastVisible) {
      const cursorSnap = await baseRef
        .child(lastVisible)
        .child("lastUpdate")
        .once("value");
      const cursorTimestamp = cursorSnap.val();

      if (cursorTimestamp == null) {
        return { success: true, data: { cards: [], lastVisible: null } };
      }

      query = query.endBefore(cursorTimestamp, lastVisible).limitToLast(limit);
    } else {
      query = query.limitToLast(limit);
    }

    const snap = await query.once("value");

    let results = [];
    snap.forEach((child) => {
      const chat = child.val();
      results.push(chat);
    });

    // Reverse to get descending order (RTDB returns ascending)
    results.reverse();

    const nextLastVisible =
      results.length === limit ? results[results.length - 1]?.groupId : null;

    return {
      success: true,
      data: {
        cards: results,
        lastVisible: nextLastVisible,
      },
    };
  } catch (error) {
    console.error("Error getting recent messages:", error);
    return {
      success: false,
      message: error.message,
      isNative: false,
      type: "error",
    };
  }
};

const RECENT_MESSAGES_STREAM_MAP = new Map();

const startRecentMessagesListener = (userId, query) => {
  const onChildAddedOrChanged = (snapshot) => {
    try {
      const data = snapshot.val();
      broadcastRecentMessage(userId, data);
    } catch (error) {
      console.error("Error in recent messages listener:", error);
    }
  };

  const onChildRemoved = (snapshot) => {
    console.log("onChildRemoved");
    try {
      const data = snapshot.val() || {};
      const groupId = snapshot.key || data.groupId;
      if (groupId) {
        broadcastRecentMessage(userId, { ...data, groupId, removed: true });
      }
    } catch (error) {
      console.error("Error in recent messages removed listener:", error);
    }
  };

  const entry = RECENT_MESSAGES_STREAM_MAP.get(userId);
  if (!entry) return;

  entry.listener = onChildAddedOrChanged;
  entry.removedListener = onChildRemoved;
  entry.query = query;

  query.on("child_added", onChildAddedOrChanged);
  query.on("child_changed", onChildAddedOrChanged);
  query.on("child_removed", onChildRemoved);
};

const broadcastRecentMessage = (userId, data) => {
  const streamEntry = RECENT_MESSAGES_STREAM_MAP.get(userId);
  if (!streamEntry || !streamEntry.res) return;
  const res = streamEntry.res;
  try {
    res.write(`event: message\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (err) {
    console.warn(`Failed to write to recent messages client ${userId}:`, err);
    try {
      res.end();
    } catch (e) {}
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
};

module.exports = {
  sendMessage,
  getMessages,
  startChildAddedListener,
  STREAM_MAP,
  markGroupAsReadHelper,
  getUserGroupChatStateHelper,
  getRecentMessagesHelper,
  startRecentMessagesListener,
  RECENT_MESSAGES_STREAM_MAP,
};
