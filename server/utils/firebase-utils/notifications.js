const { db } = require("../../firebase/firebaseAdmin");
const { INITIALE_LOADERS_COUNT } = require("../global");

const resolveTimestamp = (ts) => {
  if (!ts) return Date.now();
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  if (typeof ts === "number") return ts;
  const d = new Date(ts).getTime();
  return isNaN(d) ? Date.now() : d;
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
  criteria = {}
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
      message: "An error occurred while fetching notifications",
    };
  }
};

const markLoadedNotificationsAsRead = async (userId, notificationIds = [], category = null) => {
  try {
    const notifCollection = db
      .collection("notifications")
      .doc(userId)
      .collection("notifications");

    if (category) {
      let query = notifCollection.where("read", "==", false);
      if (category !== "All") {
        query = query.where("category", "==", category);
      }
      const snapshot = await query.get();
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
    }

    if (!notificationIds || !notificationIds.length) return { success: true, count: 0 };
    for (let i = 0; i < notificationIds.length; i += 500) {
      const chunk = notificationIds.slice(i, i + 500);
      const batch = db.batch();
      for (const id of chunk) {
        const docRef = notifCollection.doc(id);
        batch.update(docRef, { read: true });
      }
      await batch.commit();
    }
    return { success: true, count: notificationIds.length };
  } catch (error) {
    console.error("Error marking loaded notifications as read:", error);
    return { success: false, message: error.message };
  }
};

const updateJoinRequestNotificationStatus = async (
  userId,
  groupId,
  demandeId,
  newStatus
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
      const data = doc.data();
      await doc.ref.update({
        read: true,
        type: newStatus === "accepted" ? "join_accepted" : "join_rejected",
        message: `Join request from ${
          data.metadata?.senderName || "user"
        } for group ${data.metadata?.groupName || "group"} was ${newStatus}.`,
      });
    }
  } catch (error) {
    console.error("Error updating join request notification status:", error);
  }
};

const notifyJoinRequest = async (
  groupId,
  groupName,
  adminId,
  applicantUser,
  demandeId
) => {
  await addNotification(adminId, {
    type: "join_request",
    title: "Join Request",
    message: `${applicantUser.fullName || "A user"} has requested to join your group ${groupName}.`,
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
    title: "Request Sent",
    message: `Your request to join ${groupName} is pending approval.`,
    category: "Groups",
    read: false,
    metadata: { groupId, groupName, demandeId },
  });
};

const notifyJoinResult = async (
  applicantId,
  groupId,
  groupName,
  isAccepted
) => {
  await addNotification(applicantId, {
    type: isAccepted ? "join_accepted" : "join_rejected",
    title: isAccepted ? "Request Accepted" : "Request Rejected",
    message: isAccepted
      ? `You've successfully joined the group ${groupName}.`
      : `Your request to join ${groupName} was rejected.`,
    category: "Groups",
    read: false,
    metadata: { groupId, groupName },
  });
};

const markSessionStartedNotificationsEnded = async (members = [], sessionId) => {
  try {
    if (!sessionId || !members || !members.length) return;
    for (const userId of members) {
      if (!userId) continue;
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
    }
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
  members = []
) => {
  if (!isStarted && sessionId) {
    await markSessionStartedNotificationsEnded(members, sessionId);
  }
  await addNotificationsToUsers(members, {
    type: isStarted ? "session_started" : "session_ended",
    title: isStarted ? "Session Started" : "Session Ended",
    message: isStarted
      ? `A new session "${sessionName}" has started in ${groupName}.`
      : `The session "${sessionName}" in ${groupName} has ended.`,
    category: "Sessions",
    metadata: { groupId, groupName, sessionId, sessionName, sessionEnded: !isStarted },
  });
};

const notifyRoleTransfer = async (
  groupId,
  groupName,
  oldAdminId,
  newAdminId,
  newAdminName
) => {
  if (newAdminId) {
    await addNotification(newAdminId, {
      type: "role_transferred",
      title: "Role Transferred",
      message: `Admin role was transferred to you in ${groupName}.`,
      category: "Groups",
      read: false,
      metadata: { groupId, groupName },
    });
  }
  if (oldAdminId) {
    await addNotification(oldAdminId, {
      type: "role_demoted",
      title: "Role Transferred",
      message: `You've been demoted from Admin in ${groupName}.`,
      category: "Groups",
      read: false,
      metadata: { groupId, groupName },
    });
  }
};

const notifyMemberRemoved = async (removedUserId, groupId, groupName) => {
  await addNotification(removedUserId, {
    type: "member_removed",
    title: "Removed from Group",
    message: `You were removed from ${groupName} by the admin.`,
    category: "Groups",
    read: false,
    metadata: { groupId, groupName },
  });
};

const notifyGroupDeleted = async (members = [], groupId, groupName) => {
  await addNotificationsToUsers(members, {
    type: "group_deleted",
    title: "Group Deleted",
    message: `The group ${groupName} has been deleted.`,
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
  notifyJoinRequest,
  notifyJoinResult,
  notifySessionStatus,
  notifyRoleTransfer,
  notifyMemberRemoved,
  notifyGroupDeleted,
};
