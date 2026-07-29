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
    const groupSnap = await groupRef.get();

    if (!groupSnap.exists) {
      return {
        success: false,
        message: "api:group_not_found",
        isNative: true,
        type: "info",
      };
    }

    const group = groupSnap.data();
    const membersCount = (
      await groupRef.collection("members").count().get()
    ).data().count;

    if (group.maxMembers <= membersCount)
      return {
        success: false,
        message: "api:group_is_full",
        isNative: true,
        type: "info",
      };

    const isRequestSent = (
      await groupRef.collection("requests").doc(userData.uid).get()
    ).exists;

    if (isRequestSent)
      return {
        message: "api:you_have_already_sent_a_request",
        success: false,
        isNative: true,
        type: "info",
      };

    const isAlreadyMember = (
      await groupRef.collection("members").doc(userData.uid).get()
    ).exists;

    if (isAlreadyMember)
      return {
        message: "api:you_are_already_a_member",
        success: false,
        isNative: true,
        type: "info",
      };

    if (!group.showInSearch)
      return {
        success: false,
        message: "api:the_group_is_private_and_not_visible",
        isNative: true,
        type: "info",
      };

    const demandeDate = new Date().toISOString();

    await groupRef.collection("requests").doc(userData.uid).set({
      uid: userData.uid,
      fullName: userData.fullName,
      email: userData.email,
      photoURL: userData.photoURL,
      demandeDate,
    });

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
    const groupSnap = await groupRef.get();
    const groupData = groupSnap.data();

    if (!groupSnap.exists) {
      return {
        success: false,
        message: "api:group_not_found_1",
        isNative: true,
        type: "info",
      };
    }

    if (groupData.creator !== userId) {
      return {
        success: false,
        message: "api:only_the_group_creator_can_accept_requests",
        isNative: true,
        type: "warning",
      };
    }

    const requestToAcceptSnap = await groupRef
      .collection("requests")
      .doc(requestId)
      .get();

    if (!requestToAcceptSnap.exists) {
      return {
        success: false,
        message: "api:join_request_not_found",
        isNative: true,
        type: "info",
      };
    }

    const requestToAccept = requestToAcceptSnap.data();

    const newMember = {
      uid: requestToAccept.uid,
      fullName: requestToAccept.fullName,
      email: requestToAccept.email,
      photoURL: requestToAccept.photoURL,
    };

    const isAlreadyMember = (
      await groupRef.collection("members").doc(newMember.uid).get()
    ).exists;

    if (isAlreadyMember) {
      await requestToAcceptSnap.ref.delete();
      return {
        success: false,
        message: "api:user_is_already_a_member",
        isNative: true,
        type: "info",
      };
    }

    await groupRef.collection("members").doc(newMember.uid).set(newMember);
    await groupRef.update({
      membersCount: FieldValue.increment(1),
    });
    const userRef = db.collection("users").doc(newMember.uid);
    await saveGroupToUser(newMember.uid, groupId, groupData);
    await syncUserGroupSnapshot(groupId, {
      membersCount: FieldValue.increment(1),
    });
    await requestToAcceptSnap.ref.delete();
    await userRef
      .collection("sentRequests")
      .doc(groupId)
      .update({ status: "accepted" });
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

    await updateJoinRequestNotificationStatus(
      userId,
      groupId,
      requestId,
      "accepted",
    );
    await updateJoinInviteNotificationStatus(
      newMember.uid,
      groupId,
      "accepted",
    );
    await notifyJoinResult(requestId, groupId, groupData.name, true);

    return { success: true, message: "api:join_request_accepted_successfully" };
  } catch (error) {
    console.error("Error accepting request:", error.message);
    return {
      success: false,
      message: "api:failed_to_accept_request",
      isNative: false,
      type: "error",
    };
  }
};

const rejectRequest = async (groupId, requestId, userId) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();
    const group = groupSnap.data();

    if (!groupSnap.exists) {
      return {
        success: false,
        message: "api:group_not_found_1",
        isNative: true,
        type: "info",
      };
    }

    if (group.creator !== userId) {
      return {
        success: false,
        message: "api:only_the_group_creator_can_accept_requests",
        isNative: true,
        type: "warning",
      };
    }

    const requestSnap = await groupRef
      .collection("requests")
      .doc(requestId)
      .get();

    if (!requestSnap.exists)
      return {
        success: false,
        message: "api:join_request_not_found",
        isNative: true,
        type: "info",
      };

    await requestSnap.ref.delete();
    await db
      .collection("users")
      .doc(requestId)
      .collection("sentRequests")
      .doc(groupRef.id)
      .update({
        status: "rejected",
      });

    await updateJoinRequestNotificationStatus(
      userId,
      groupId,
      requestId,
      "rejected",
    );
    await notifyJoinResult(requestId, groupId, group.name, false);

    return {
      success: true,
      message: "api:request_rejected_successfully",
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "api:something_wrong_happened",
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

const getRequests = async (groupId, userId) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();
    if (!groupSnap.exists)
      return {
        success: false,
        message: "api:group_not_found",
        isNative: true,
        type: "info",
      };
    const creator = groupSnap.data().creator;
    const requestsSnap = await groupRef.collection("requests").get();
    const requests = getFormatedRequests(requestsSnap.docs);
    return {
      success: true,
      context: {
        count: requests.length,
        isAdmin: creator === userId,
        demandes: requests,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "api:an_error_occurred_while_fetching_requests",
      isNative: false,
      type: "error",
    };
  }
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
  getRequests,
  sendRequest,
  acceptRequest,
  rejectRequest,
  getDemandesByGroupId,
};
