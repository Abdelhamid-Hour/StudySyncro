const { db, bucket } = require("../../firebase/firebaseAdmin");
const { MAX_FILE_SIZE_50MB } = require("../global");
const PROFILE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const FILE_ALLOWED_TYPES = {
  IMAGE: "image/jpeg, image/png, image/gif, image/webp",
  DOCUMENT:
    "application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  TEXT: "text/plain",
  ARCHIVE: "application/zip, application/x-tar, application/x-rar-compressed",
  AUDIO: "audio/mpeg, audio/wav, audio/ogg",
  VIDEO: "video/mp4, video/webm, video/x-msvideo",
};

const getGroupById = async (groupId) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const snaphsot = await groupRef.get();
    if (!snaphsot.exists) {
      return {
        success: false,
        message: "api:group_not_found_1",
        isNative: true,
        type: "info",
      };
    }
    const group = { id: groupId, ...snaphsot.data() };
    return {
      success: true,
      group,
    };
  } catch (error) {
    return {
      success: false,
      message: "api:internal_server_error",
      isNative: false,
      type: "error",
    };
  }
};

const saveGroupToUser = async (userId, groupId, groupData) => {
  await db
    .collection("users")
    .doc(userId)
    .collection("userGroups")
    .doc(groupId)
    .set({
      description: groupData.description,
      level: groupData.level,
      sampleMembers: groupData.sampleMembers,
      membersCount: groupData.membersCount,
      name: groupData.name,
      subject: groupData.subject,
      visibility: groupData.visibility,
      creator: groupData.creator,
      creationDate: groupData.creationDate,
    });
};

const syncUserGroupSnapshot = async (groupId, updates) => {
  try {
    const membersSnap = await db
      .collection("groups")
      .doc(groupId)
      .collection("members")
      .get();
    if (membersSnap.empty) return;

    let batch = db.batch();
    let count = 0;
    for (const memberDoc of membersSnap.docs) {
      const userGroupRef = db
        .collection("users")
        .doc(memberDoc.id)
        .collection("userGroups")
        .doc(groupId);
      batch.set(userGroupRef, updates, { merge: true });
      count++;
      if (count === 490) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }
    if (count > 0) await batch.commit();
  } catch (error) {
    console.error(`Error syncing userGroups for group ${groupId}:`, error);
  }
};

const syncUserGroupRemoval = async (groupId) => {
  try {
    const membersSnap = await db
      .collection("groups")
      .doc(groupId)
      .collection("members")
      .get();
    if (membersSnap.empty) return;

    let batch = db.batch();
    let count = 0;
    for (const memberDoc of membersSnap.docs) {
      const userGroupRef = db
        .collection("users")
        .doc(memberDoc.id)
        .collection("userGroups")
        .doc(groupId);
      batch.delete(userGroupRef);
      count++;
      if (count === 490) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }
    if (count > 0) await batch.commit();
  } catch (error) {
    console.error(`Error removing userGroups for group ${groupId}:`, error);
  }
};

const refillSampleMembersIfNeeded = async (groupRef) => {
  try {
    const txResult = await db.runTransaction(async (t) => {
      const groupDoc = await t.get(groupRef);
      if (!groupDoc.exists) return { abort: true };
      
      const groupData = groupDoc.data();
      let sampleMembers = structuredClone(groupData.sampleMembers) || [];
      
      if (sampleMembers.length >= 2) {
        return { abort: true };
      }

      // Read members subcollection
      const membersSnap = await t.get(groupRef.collection("members").limit(2));
      const members = membersSnap.docs.map((doc) => doc.data());
      
      const sampleUids = new Set(sampleMembers.map((m) => m.uid));
      for (const m of members) {
        if (!sampleUids.has(m.uid)) {
          sampleMembers.push({
            uid: m.uid,
            fullName: m.fullName,
            email: m.email,
            photoURL: m.photoURL,
          });
          if (sampleMembers.length === 2) break;
        }
      }

      const prevSampleMembers = groupData.sampleMembers || [];
      if (sampleMembers.length !== prevSampleMembers.length) {
        t.update(groupRef, { sampleMembers });
        return { abort: false, sampleMembers };
      }
      
      return { abort: true };
    });

    if (!txResult.abort) {
      await syncUserGroupSnapshot(groupRef.id, { sampleMembers: txResult.sampleMembers });
    }
  } catch (error) {
    console.error("Error in refillSampleMembersIfNeeded:", error);
  }
};

const uploadFileToStorage = async (filePath, file, isAvatar = false) => {
  try {
    if (!file) throw new Error("api:no_file_provided_for_upload");
    if (file.size === 0) throw new Error("api:file_is_empty");
    if (file.size > MAX_FILE_SIZE_50MB)
      throw new Error("api:the_file_should_be_less_or_equal_to_50mb");

    const isSupportedAvatarType =
      isAvatar && PROFILE_ALLOWED_TYPES.includes(file.mimetype);
    const isSupportedFileType =
      !isAvatar &&
      Object.values(FILE_ALLOWED_TYPES).some((types) =>
        types.includes(file.mimetype),
      );
    if (!isSupportedAvatarType && !isSupportedFileType)
      throw new Error("api:invalid_file_type");

    const fileUpload = bucket.file(
      filePath + `${Date.now()}-${file.originalname}`,
    );

    await fileUpload.save(file.buffer, {
      metadata: { contentType: file.mimetype },
    });

    const URL = await fileUpload.getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
      responseDisposition: `attachment; filename="${encodeURIComponent(
        file.originalname,
      )}"`,
    });

    return { success: true, URL: URL[0] };
  } catch (error) {
    console.error("Error uploading file to storage:", error);
    const isValidation = [
      "No file provided for upload",
      "File is empty",
      "The file should be less or equal to 50MB",
      "Invalid file type",
    ].includes(error.message);
    return {
      success: false,
      message: error.message,
      isNative: isValidation,
      type: isValidation ? "warning" : "error",
    };
  }
};

module.exports = {
  getGroupById,
  uploadFileToStorage,
  refillSampleMembersIfNeeded,
  syncUserGroupSnapshot,
  syncUserGroupRemoval,
  PROFILE_ALLOWED_TYPES,
  saveGroupToUser,
};
