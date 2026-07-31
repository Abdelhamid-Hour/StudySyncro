const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../../firebase/firebaseAdmin");
const {
  refillSampleMembersIfNeeded,
  syncUserGroupSnapshot,
  saveGroupToUser,
} = require("./shared");
const { toReadableDate, INITIALE_LOADERS_COUNT } = require("../global");
const {
  notifyJoinRequest,
  notifyJoinResult,
  updateJoinRequestNotificationStatus,
  updateJoinInviteNotificationStatus,
} = require("./notifications");

const sendRequest = async (groupId, userData) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const requestDocRef = groupRef.collection("requests").doc(userData.uid);
    const memberDocRef = groupRef.collection("members").doc(userData.uid);

    const demandeDate = new Date().toISOString();

    const txResult = await db.runTransaction(async (t) => {
      const [groupSnap, requestSnap, memberSnap] = await Promise.all([
        t.get(groupRef),
        t.get(requestDocRef),
        t.get(memberDocRef),
      ]);

      if (!groupSnap.exists) {
        return { abort: true, message: "api:group_not_found", isNative: true, type: "info" };
      }

      const group = groupSnap.data();
      const membersCount = group.membersCount || 0;

      if (group.maxMembers <= membersCount) {
        return { abort: true, message: "api:group_is_full", isNative: true, type: "info" };
      }

      if (requestSnap.exists) {
        return { abort: true, message: "api:you_have_already_sent_a_request", isNative: true, type: "info" };
      }

      if (memberSnap.exists) {
        return { abort: true, message: "api:you_are_already_a_member", isNative: true, type: "info" };
      }

      if (!group.showInSearch) {
        return { abort: true, message: "api:the_group_is_private_and_not_visible", isNative: true, type: "info" };
      }

      t.set(requestDocRef, {
        uid: userData.uid,
        fullName: userData.fullName,
        email: userData.email,
        photoURL: userData.photoURL,
        demandeDate,
      });

      return { abort: false, group };
    });

    if (txResult.abort) {
      return {
        success: false,
        message: txResult.message,
        isNative: txResult.isNative,
        type: txResult.type,
      };
    }

    const group = txResult.group;

    await db
      .collection("users")
      .doc(userData.uid)
      .collection("sentRequests")
      .doc(groupRef.id)
      .set({
        groupId: groupRef.id,
        groupName: group.name,
        status: "pending",
        demandeDate,
      });

    await notifyJoinRequest(
      groupRef.id,
      group.name,
      group.creator,
      userData,
      userData.uid,
    );

    return {
      success: true,
      status: "requested",
    };
  } catch (error) {
    console.log(error.message);
    return {
      success: false,
      message: error.message || "An unexpected error occurred.",
      isNative: false,
      type: "error",
    };
  }
};

const acceptRequest = async (groupId, requestId, userId) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const requestDocRef = groupRef.collection("requests").doc(requestId);
    const memberDocRef = groupRef.collection("members").doc(requestId);

    const txResult = await db.runTransaction(async (t) => {
      const [groupSnap, requestSnap, memberSnap] = await Promise.all([
        t.get(groupRef),
        t.get(requestDocRef),
        t.get(memberDocRef),
      ]);

      if (!groupSnap.exists) {
        return { abort: true, message: "api:group_not_found_1", isNative: true, type: "info" };
      }

      const groupData = groupSnap.data();

      if (groupData.creator !== userId) {
        return { abort: true, message: "api:only_the_group_creator_can_accept_requests", isNative: true, type: "warning" };
      }

      if (!requestSnap.exists) {
        return { abort: true, message: "api:join_request_not_found", isNative: true, type: "info" };
      }

      if (memberSnap.exists) {
        t.delete(requestDocRef);
        return { abort: true, message: "api:user_is_already_a_member", isNative: true, type: "info" };
      }

      const requestToAccept = requestSnap.data();
      const newMember = {
        uid: requestToAccept.uid,
        fullName: requestToAccept.fullName,
        email: requestToAccept.email,
        photoURL: requestToAccept.photoURL,
      };

      t.set(memberDocRef, newMember);
      t.update(groupRef, { membersCount: FieldValue.increment(1) });
      t.delete(requestDocRef);

      return { abort: false, groupData, newMember };
    });

    if (txResult.abort) {
      return {
        success: false,
        message: txResult.message,
        isNative: txResult.isNative,
        type: txResult.type,
      };
    }

    const { groupData, newMember } = txResult;
    const userRef = db.collection("users").doc(newMember.uid);

    await saveGroupToUser(newMember.uid, groupId, groupData);
    await syncUserGroupSnapshot(groupId, {
      membersCount: FieldValue.increment(1),
    });
    await userRef
      .collection("sentRequests")
      .doc(groupId)
      .update({
        status: "accepted",
      });

    await updateJoinRequestNotificationStatus(
      userId,
      groupId,
      requestId,
      "accepted",
    );
    await notifyJoinResult(requestId, groupId, groupData.name, true);

    await refillSampleMembersIfNeeded(groupRef);

    if (groupData.currentSession) {
      const sessionSnap = await db
        .collection("sessions")
        .doc(groupData.currentSession)
        .get();
      if (sessionSnap.exists) {
        const sData = sessionSnap.data();
        await userRef
          .collection("activeSessions")
          .doc(groupData.currentSession)
          .set({
            name: sData.name || "",
            description: sData.description || "",
            duration: sData.duration || 0,
            startDate: sData.startDate || "",
            groupName: sData.groupName || "",
            tasksCount: sData.tasksCount || 0,
            joinedCount: sData.joinedCount || 0
          });
      }
    }

    await updateJoinInviteNotificationStatus(
      newMember.uid,
      groupId,
      "accepted",
    );

    return {
      success: true,
      message: "api:request_accepted_successfully",
      newMember,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "api:error_accepting_the_request",
      isNative: false,
      type: "error",
    };
  }
};

const rejectRequest = async (groupId, requestId, userId) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const requestDocRef = groupRef.collection("requests").doc(requestId);

    const txResult = await db.runTransaction(async (t) => {
      const [groupSnap, requestSnap] = await Promise.all([
        t.get(groupRef),
        t.get(requestDocRef),
      ]);

      if (!groupSnap.exists) {
        return { abort: true, message: "api:group_not_found_1", isNative: true, type: "info" };
      }

      const group = groupSnap.data();

      if (group.creator !== userId) {
        return { abort: true, message: "api:only_the_group_creator_can_accept_requests", isNative: true, type: "warning" };
      }

      if (!requestSnap.exists) {
        return { abort: true, message: "api:join_request_not_found", isNative: true, type: "info" };
      }

      t.delete(requestDocRef);

      return { abort: false, groupName: group.name };
    });

    if (txResult.abort) {
      return {
        success: false,
        message: txResult.message,
        isNative: txResult.isNative,
        type: txResult.type,
      };
    }

    await db
      .collection("users")
      .doc(requestId)
      .collection("sentRequests")
      .doc(groupId)
      .update({
        status: "rejected",
      });

    await updateJoinRequestNotificationStatus(
      userId,
      groupId,
      requestId,
      "rejected",
    );
    await notifyJoinResult(requestId, groupId, txResult.groupName, false);

    return {
      success: true,
      message: "api:request_rejected_successfully",
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "api:error_rejecting_the_request",
      isNative: false,
      type: "error",
    };
  }
};

const getFormatedRequests = (requests) =>
  requests.map((doc) => ({
    userId: doc.id,
    fullName: doc.data().fullName,
    photoURL: doc.data().photoURL,
    demandeDate: toReadableDate(doc.data().demandeDate),
  }));

const getFilteredRequests = (criteria, demandes) => {
  demandes = demandes.filter((doc) => {
    const fullName = doc.data().fullName?.toLowerCase() || "";
    const searchTerm = criteria.search?.trim().toLowerCase() || "";
    const matchSearch = searchTerm ? fullName.includes(searchTerm) : true;
    const demandeDate = doc.data().demandeDate;
    const matchDate = criteria.date
      ? demandeDate && new Date(demandeDate) >= new Date(criteria.date)
      : true;

    return matchSearch && matchDate;
  });
  return getFormatedRequests(demandes);
};

const getDemandesByGroupId = async (
  groupId,
  limit = INITIALE_LOADERS_COUNT,
  lastVisible = null,
  criteria = {},
) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();

    if (!groupSnap.exists) {
      return {
        success: false,
        message: "api:group_not_found",
        isNative: true,
        type: "info",
      };
    }

    let demandes = [];

    // Fast path: if search looks like a member id, try fetching that doc directly
    if (criteria.search) {
      const maybeDoc = await groupRef
        .collection("demandes")
        .doc(criteria.search)
        .get();
      if (maybeDoc.exists) {
        const formatted = getFormatedRequests([maybeDoc]);
        return {
          success: true,
          count: formatted.length,
          cards: formatted,
          lastVisible: null,
        };
      }
    }

    // Iteratively fetch batches until we collect `limit` filtered demandes or no more pages
    do {
      const batchSize = Number(limit) * 10;
      // ORDER BY: adjust the field if your member docs don't have `fullName`
      let query = groupRef
        .collection("requests")
        .orderBy("demandeDate", criteria.sort || "desc")
        .limit(batchSize);

      if (lastVisible) {
        const lastDoc = await groupRef
          .collection("requests")
          .doc(lastVisible)
          .get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        } else {
          // can't page further if the provided lastVisible doesn't exist
          lastVisible = null;
          break;
        }
      }

      const snapshot = await query.get();

      // Filter the fetched batch using your search criteria helper
      const filteredBatch = getFilteredRequests(criteria, snapshot.docs);

      // Add only what's remaining to reach `limit`
      const remaining = limit - demandes.length;
      demandes = demandes.concat(filteredBatch.slice(0, remaining));

      // If we fetched a full batch, there may be more pages; else no more pages
      lastVisible =
        snapshot.docs.length === batchSize
          ? snapshot.docs[snapshot.docs.length - 1].id
          : null;
    } while (demandes.length < limit && lastVisible !== null);

    const finalLastVisible =
      demandes.length === limit ? demandes[demandes.length - 1].id : null;

    return {
      success: true,
      count: demandes.length,
      cards: demandes,
      lastVisible: finalLastVisible,
    };
  } catch (error) {
    console.error("Error in getDemandes:", error);
    return {
      success: false,
      message: "api:an_error_occurred_while_fetching_demandes",
      isNative: false,
      type: "error",
    };
  }
};

module.exports = {
  sendRequest,
  acceptRequest,
  rejectRequest,
  getDemandesByGroupId,
};
