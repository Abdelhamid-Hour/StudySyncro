const { rDb } = require("../../firebase/firebaseAdmin");
const { uploadFileToStorage } = require("./shared");

const FILE_STATUS = {
  UPLOADING: "uploading",
  UPLOADED: "uploaded",
  FAILED: "failed",
};

const sendMessage = async (
  file,
  message,
  sessionId,
  groupId,
  timestamp,
  user
) => {
  try {
    if (!user.joinedGroupsIds.includes(groupId)) {
      throw new Error("You Are Unauthorized to send message to this group");
    }

    if (sessionId && !user.currentSession !== sessionId) {
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
      timestamp: timestamp || Date.now(),
      content: {},
    };

    if (message) {
      messageData.content.text = message;
    } else {
      messageData.content.filePath = "";
      messageData.content.fileName =
        file.originalname || file.name || "unknown_filename";
      messageData.content.fileType = file.mimetype;
      messageData.content.fileStatus = FILE_STATUS.UPLOADING;
      const chatRef = await ref.push(messageData);
      const filePath = sessionId
        ? `chats/sessions/${sessionId}/${chatRef.key}`
        : `chats/groups/${groupId}/${chatRef.key}`;
      const res = await uploadFileToStorage(filePath, file);
      if (!res.success) {
        await chatRef
          .child("content")
          .update({ fileStatus: FILE_STATUS.FAILED });
        return { success: false, messageId: chatRef.key, message: res.message };
      }
      await chatRef.child("content").update({
        fileStatus: FILE_STATUS.UPLOADED,
        filePath: res.URL,
      });
      return {
        success: true,
        data: {
          filePath: res.URL,
          messageId: chatRef.key,
        },
      };
    }

    const chatRef = await ref.push(messageData);

    return {
      success: true,
      data: {
        messageId: chatRef.key,
      },
    };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendMessage,
};
