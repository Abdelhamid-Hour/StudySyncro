const { db } = require("../../firebase/firebaseAdmin");
const admin = require("firebase-admin");
const { INITIALE_LOADERS_COUNT } = require("../global");
const emailService = require("../email-service");

const resolveTimestamp = (ts) => {
  if (!ts) return Date.now();
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  if (typeof ts === "number") return ts;
  const d = new Date(ts).getTime();
  return isNaN(d) ? Date.now() : d;
};

const getUserEmail = async (userId) => {
  if (!userId) return null;
  try {
    const doc = await db.collection("users").doc(userId).get();
    if (doc.exists) return doc.data().email;
  } catch (err) {
    console.error("Error getting user email:", err);
  }
  return null;
};

const getUsersEmails = async (userIds) => {
  if (!userIds || userIds.length === 0) return [];
  const emails = [];
  try {
    const uniqueIds = [...new Set(userIds)];
    for (let i = 0; i < uniqueIds.length; i += 30) {
      const chunk = uniqueIds.slice(i, i + 30);
      const snap = await db.collection("users").where(admin.firestore.FieldPath.documentId(), "in", chunk).get();
      snap.docs.forEach(doc => {
        if (doc.data().email) emails.push(doc.data().email);
      });
    }
  } catch (err) {
    console.error("Error getting user emails:", err);
  }
  return emails;
};

const addNotification = async (userId, notification) => {
  try {
    if (!userId) return;
    const notificationRef = db
      .collection("notifications")
      .doc(userId)
      .collection("notifications");
    await notificationRef.add({
      ...notification,
      timestamp: Date.now(),
      read: false,
    });
  } catch (error) {
    console.error("Failed to add notification:", error);
  }
};

const addNotificationsToUsers = async (userIds = [], notification) => {
  try {
    if (!userIds || !userIds.length) return;
    const fanoutBatches = [];
    let currentBatch = db.batch();
    let batchCount = 0;

    for (const userId of userIds) {
      if (!userId) continue;
      const notificationRef = db
        .collection("notifications")
        .doc(userId)
        .collection("notifications")
        .doc();
      currentBatch.set(notificationRef, {
        ...notification,
        timestamp: Date.now(),
        read: false,
      });
      batchCount++;
      if (batchCount === 500) {
        fanoutBatches.push(currentBatch.commit());
        currentBatch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      fanoutBatches.push(currentBatch.commit());
    }
    await Promise.all(fanoutBatches);
  } catch (error) {
    console.error("Failed to add notifications in batch:", error);
  }
};

const getUserNotifications = async (
  userId,
  limit = INITIALE_LOADERS_COUNT,
  lastVisible = null,
  criteria = {},
) => {
  try {
    const userNotifRef = db
      .collection("notifications")
      .doc(userId)
      .collection("notifications");

    const batchSize = Number(limit);
    let query = userNotifRef;

    if (criteria.category && criteria.category !== "All") {
      query = query.where("category", "==", criteria.category);
    }

    query = query.orderBy("timestamp", "desc").limit(batchSize);

    if (lastVisible) {
      const lastDoc = await userNotifRef.doc(lastVisible).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.get();

    const notifications = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: resolveTimestamp(data.timestamp),
      };
    });

    const finalLastVisible =
      snapshot.docs.length === batchSize
        ? snapshot.docs[snapshot.docs.length - 1].id
        : null;

    const unreadSnap = await userNotifRef.where("read", "==", false).get();
    const unreadCount = unreadSnap.size;

    return {
      success: true,
      count: notifications.length,
      cards: notifications,
      lastVisible: finalLastVisible,
      unreadCount: unreadCount,
    };
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return {
      success: false,
      message: "api:an_error_occurred_while_fetching_notifications",
      isNative: false,
      type: "error",
    };
  }
};

const markLoadedNotificationsAsRead = async (userId) => {
  try {
    const notifCollection = db
      .collection("notifications")
      .doc(userId)
      .collection("notifications");

    const snapshot = await notifCollection.where("read", "==", false).get();
    if (snapshot.empty) return { success: true, count: 0 };

    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += 500) {
      const chunk = docs.slice(i, i + 500);
      const batch = db.batch();
      chunk.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();
    }
    return { success: true, count: docs.length };
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return {
      success: false,
      message: error.message,
      isNative: false,
      type: "error",
    };
  }
};

const updateJoinRequestNotificationStatus = async (
  userId,
  groupId,
  demandeId,
  newStatus,
) => {
  try {
    const notifCollection = db
      .collection("notifications")
      .doc(userId)
      .collection("notifications");
    const snapshot = await notifCollection
      .where("metadata.groupId", "==", groupId)
      .where("metadata.demandeId", "==", demandeId)
      .where("type", "==", "join_request")
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      await doc.ref.update({
        read: true,
        type:
          newStatus === "accepted"
            ? "join_request_accepted"
            : "join_request_rejected",
        "metadata.status": newStatus,
      });
    }
  } catch (error) {
    console.error("Error updating join request notification status:", error);
  }
};

const updateJoinInviteNotificationStatus = async (
  userId,
  groupId,
  newStatus,
) => {
  try {
    const notifCollection = db
      .collection("notifications")
      .doc(userId)
      .collection("notifications");
    const snapshot = await notifCollection
      .where("metadata.groupId", "==", groupId)
      .where("type", "==", "join_invite")
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      await doc.ref.update({
        read: true,
        type:
          newStatus === "accepted"
            ? "join_invite_accepted"
            : "join_invite_rejected",
        "metadata.status": newStatus,
      });
    }
  } catch (error) {
    console.error("Error updating join invite notification status:", error);
  }
};

const notifyJoinRequest = async (
  groupId,
  groupName,
  adminId,
  applicantUser,
  demandeId,
) => {
  await addNotification(adminId, {
    type: "join_request",
    category: "Join Request",
    read: false,
    metadata: {
      groupId,
      groupName,
      senderId: applicantUser.uid || applicantUser.id,
      senderName: applicantUser.fullName || "User",
      senderPhotoURL: applicantUser.photoURL || null,
      demandeId,
    },
  });

  await addNotification(applicantUser.uid || applicantUser.id, {
    type: "join_pending",
    category: "Groups",
    read: false,
    metadata: { groupId, groupName, demandeId },
  });

  // Send Email
  const adminEmail = await getUserEmail(adminId);
  const applicantName = applicantUser.fullName || "A user";
  emailService.sendAdminJoinRequestEmail(adminEmail, applicantName, groupName, groupId).catch(console.error);
};

const notifyJoinResult = async (
  applicantId,
  groupId,
  groupName,
  isAccepted,
) => {
  await addNotification(applicantId, {
    type: isAccepted ? "join_accepted" : "join_rejected",
    category: "Groups",
    read: false,
    metadata: { groupId, groupName, isAccepted: Boolean(isAccepted) },
  });

  // Send Email
  const applicantEmail = await getUserEmail(applicantId);
  emailService.sendJoinResultEmail(applicantEmail, groupName, isAccepted, groupId).catch(console.error);
};

const notifyGroupInvite = async (
  groupId,
  groupName,
  senderUser,
  invitedUserId,
) => {
  try {
    const notifCollection = db
      .collection("notifications")
      .doc(invitedUserId)
      .collection("notifications");

    const existing = await notifCollection
      .where("metadata.groupId", "==", groupId)
      .where("type", "==", "join_invite")
      .limit(1)
      .get();

    if (!existing.empty) {
      await existing.docs[0].ref.update({
        timestamp: Date.now(),
        read: false,
      });
      return;
    }

    await addNotification(invitedUserId, {
      type: "join_invite",
      category: "Join Request",
      read: false,
      metadata: {
        groupId,
        groupName,
        senderId: senderUser.uid || senderUser.id,
        senderName: senderUser.fullName || "Admin",
        senderPhotoURL: senderUser.photoURL || null,
        isInvite: true,
      },
    });

    // Send Email
    const invitedEmail = await getUserEmail(invitedUserId);
    const senderName = senderUser.fullName || "Admin";
    emailService.sendGroupInviteEmail(invitedEmail, groupName, senderName, groupId).catch(console.error);

  } catch (error) {
    console.error("Error in notifyGroupInvite:", error);
  }
};

const markSessionStartedNotificationsEnded = async (
  members = [],
  sessionId,
) => {
  try {
    if (!sessionId || !members || !members.length) return;
    await Promise.all(
      members.map(async (userId) => {
        if (!userId) return;
        const notifsRef = db
          .collection("notifications")
          .doc(userId)
          .collection("notifications")
          .where("metadata.sessionId", "==", sessionId)
          .where("type", "==", "session_started");
        const snap = await notifsRef.get();
        if (!snap.empty) {
          const batch = db.batch();
          snap.docs.forEach((doc) => {
            batch.update(doc.ref, {
              "metadata.sessionEnded": true,
            });
          });
          await batch.commit();
        }
      }),
    );
  } catch (err) {
    console.error("Error updating session_started notifications:", err);
  }
};

const notifySessionStatus = async (
  groupId,
  groupName,
  sessionName,
  sessionId,
  isStarted,
  members = [],
  creatorId = null,
) => {
  if (!isStarted && sessionId) {
    await markSessionStartedNotificationsEnded(members, sessionId);
  }
  const batch = db.batch();
  const now = Date.now();
  for (const userId of members) {
    if (!userId) continue;
    const isAdmin = Boolean(creatorId && userId === creatorId);
    const joined = isAdmin;
    const notifRef = db
      .collection("notifications")
      .doc(userId)
      .collection("notifications")
      .doc();
    batch.set(notifRef, {
      type: isStarted ? "session_started" : "session_ended",
      category: "Sessions",
      metadata: {
        groupId,
        groupName,
        sessionId,
        sessionName,
        sessionEnded: !isStarted,
        creatorId: creatorId || "",
        isAdmin,
        joined,
      },
      timestamp: now,
      read: false,
    });
  }
  await batch.commit();

  // Send Email if session started
  if (isStarted) {
    const studentIds = members.filter(uid => uid !== creatorId); // exclude admin from the email blast
    const studentEmails = await getUsersEmails(studentIds);
    emailService.sendSessionStartedEmail(studentEmails, { sessionName, groupName }, groupId, sessionId).catch(console.error);
  }
};

const updateSessionNotificationJoined = async (userId, sessionId, joined) => {
  try {
    if (!userId || !sessionId) return;
    const notifsRef = db
      .collection("notifications")
      .doc(userId)
      .collection("notifications")
      .where("metadata.sessionId", "==", sessionId)
      .where("type", "==", "session_started");
    const snap = await notifsRef.get();
    if (!snap.empty) {
      const batch = db.batch();
      snap.docs.forEach((doc) => {
        batch.update(doc.ref, {
          "metadata.joined": joined,
        });
      });
      await batch.commit();
    }
  } catch (err) {
    console.error("Error updating session notification joined status:", err);
  }
};

const notifyRoleTransfer = async (
  groupId,
  groupName,
  oldAdminId,
  newAdminId,
  newAdminName,
) => {
  if (newAdminId) {
    await addNotification(newAdminId, {
      type: "role_transferred",
      category: "Groups",
      read: false,
      metadata: { groupId, groupName },
    });
  }
  if (oldAdminId) {
    await addNotification(oldAdminId, {
      type: "role_demoted",
      category: "Groups",
      read: false,
      metadata: { groupId, groupName, newAdminId, newAdminName },
    });
  }
};

const notifyMemberRemoved = async (removedUserId, groupId, groupName) => {
  await addNotification(removedUserId, {
    type: "member_removed",
    category: "Groups",
    read: false,
    metadata: { groupId, groupName },
  });
};

const notifyGroupDeleted = async (members = [], groupId, groupName) => {
  await addNotificationsToUsers(members, {
    type: "group_deleted",
    category: "Groups",
    metadata: { groupId, groupName },
  });
};

module.exports = {
  resolveTimestamp,
  addNotification,
  addNotificationsToUsers,
  getUserNotifications,
  markLoadedNotificationsAsRead,
  updateJoinRequestNotificationStatus,
  updateJoinInviteNotificationStatus,
  notifyJoinRequest,
  notifyJoinResult,
  notifyGroupInvite,
  notifySessionStatus,
  updateSessionNotificationJoined,
  notifyRoleTransfer,
  notifyMemberRemoved,
  notifyGroupDeleted,
  markSessionStartedNotificationsEnded,
};
