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
    if (snaphsot.empty) {
      return false;
    } else {
      const group = { id: groupId, ...snaphsot.data() };
      return group;
    }
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const refillSampleMembersIfNeeded = async (groupRef) => {
  const groupAfterUpdate = (await groupRef.get()).data();
  let sampleMembers = structuredClone(groupAfterUpdate.sampleMembers) || [];

  if (sampleMembers.length < 2) {
    // Get all current members
    const membersSnap = await groupRef.collection("members").limit(2).get();
    const members = membersSnap.docs.map((doc) => doc.data());
    // Filter out already in sampleMembers
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
    // Only update if sampleMembers actually changed
    const prevSampleMembers = groupAfterUpdate.sampleMembers || [];

    if (sampleMembers.length !== prevSampleMembers.length)
      await groupRef.update({ sampleMembers });
  }
};

const uploadFileToStorage = async (filePath, file, isAvatar = false) => {
  try {
    if (!file) throw new Error("No file provided for upload");
    if (file.size === 0) throw new Error("File is empty");
    if (file.size > MAX_FILE_SIZE_50MB)
      throw new Error("The file should be less or equal to 50MB");

    const isSupportedAvatarType =
      isAvatar && PROFILE_ALLOWED_TYPES.includes(file.mimetype);
    const isSupportedFileType =
      !isAvatar &&
      Object.values(FILE_ALLOWED_TYPES).some((types) =>
        types.includes(file.mimetype)
      );
    if (!isSupportedAvatarType && !isSupportedFileType)
      throw new Error("Invalid file type");

    const fileUpload = bucket.file(
      filePath + `/${Date.now()}-${file.originalname}`
    );

    await fileUpload.save(file.buffer, {
      metadata: { contentType: file.mimetype },
    });

    const URL = await fileUpload.getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
      responseDisposition: `attachment; filename="${encodeURIComponent(
        file.originalname
      )}"`,
    });

    return { success: true, URL: URL[0] };
  } catch (error) {
    console.error("Error uploading file to storage:", error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  getGroupById,
  uploadFileToStorage,
  refillSampleMembersIfNeeded,
  PROFILE_ALLOWED_TYPES,
};
