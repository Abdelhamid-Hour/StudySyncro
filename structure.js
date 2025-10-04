const messageStructure = {
  sender: {
    id: "",
    fullName: "",
    photoURL: "",
  },
  timestamp: "",
  content: {
    text: "",
    filePath: "",
    fileName: "",
    fileType: "",
    fileStatus: "", // uploading, uploaded, failed
    fileSize: "", // in bytes
  },
};

const messagePayload = {
  message: "",
  sessionId: "",
  groupId: "",
  timestamp: "",
};
    

/**
 * ? File storage structure
 * avatars/{userId}/...
 * chats/{groupId}/{messageId}/...
 * sessions/{sessionId}/files/...
 */

/**
 * ? RD structure
 * groups/{groupId}/chats/{messageId}/{
     sender: {id, fullName, photoURL},
     timestamp,
     content: {text, filePath, fileName, fileType, fileStatus}
 *  }
 */