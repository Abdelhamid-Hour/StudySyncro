const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../../firebase/firebaseAdmin");
const { refillSampleMembersIfNeeded } = require("./shared");
const { toReadableDate, INITIALE_LOADERS_COUNT } = require("../global");

const sendRequest = async (groupId, userData) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();

    if (!groupSnap.exists) {
      return {
        success: false,
        message: "Group not found",
      };
    }

    const group = groupSnap.data();
    const membersCount = (
      await groupRef.collection("members").count().get()
    ).data().count;

    if (group.maxMembers <= membersCount)
      return {
        success: false,
        message: "Group is full",
      };

    const isRequestSent = (
      await groupRef.collection("requests").doc(userData.uid).get()
    ).exists;

    if (isRequestSent)
      return { message: "You have already sent a request", success: false };

    const isAlreadyMember = (
      await groupRef.collection("members").doc(userData.uid).get()
    ).exists;

    if (isAlreadyMember)
      return {
        message: "You are already a member ",
        success: false,
      };

    if (!group.showInSearch)
      return {
        success: false,
        message: "The Group Is Private and Not Visible",
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

    return {
      success: true,
      status: "requested",
    };
  } catch (error) {
    console.log(error.message);
    return {
      success: false,
      message: error.message || "An unexpected error occurred.",
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
        message: `Group not found.`,
      };
    }

    if (groupData.creator !== userId) {
      return {
        success: false,
        message: "Only the group creator can accept requests.",
      };
    }

    const requestToAcceptSnap = await groupRef
      .collection("requests")
      .doc(requestId)
      .get();

    if (!requestToAcceptSnap.exists) {
      return { success: false, message: "Join request not found." };
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
      return { success: false, message: "User is already a member." };
    }

    await groupRef.collection("members").doc(newMember.uid).set(newMember);
    await groupRef.update({
      membersCount: FieldValue.increment(1),
    });
    const userRef = db.collection("users").doc(newMember.uid);
    await userRef.collection("userGroupsIds").doc(groupId).set({});
    await requestToAcceptSnap.ref.delete();
    await userRef
      .collection("sentRequests")
      .doc(groupId)
      .update({ status: "accepted" });
    await refillSampleMembersIfNeeded(groupRef);

    return { success: true, message: "Join request accepted successfully!" };
  } catch (error) {
    console.error("Error accepting request:", error.message);
    return {
      success: false,
      message: `Failed to accept request: ${
        error.message || "An unexpected error occurred."
      }`,
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
        message: `Group not found.`,
      };
    }

    if (group.creator !== userId) {
      return {
        success: false,
        message: "Only the group creator can accept requests.",
      };
    }

    const requestSnap = await groupRef
      .collection("requests")
      .doc(requestId)
      .get();

    if (!requestSnap.exists)
      return { success: false, message: "Join request not found." };

    await requestSnap.ref.delete();
    await db
      .collection("users")
      .doc(requestId)
      .collection("sentRequests")
      .doc(groupRef.id)
      .update({
        status: "rejected",
      });

    return {
      success: true,
      message: "Request rejected successfully.",
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Something wrong happened",
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
    const fullName = doc.data().fullName.toLowerCase();
    const matchSearch = criteria.search
      ? fullName.includes(criteria.search.toLowerCase())
      : true;
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
      return { success: false, message: "Group not found" };
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
      message: "An error occurred while fetching requests",
    };
  }
};

const getDemandesByGroupId = async (
  groupId,
  limit = INITIALE_LOADERS_COUNT,
  lastVisible = null,
  criteria = {}
) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();

    if (!groupSnap.exists) {
      return { success: false, message: "Group not found" };
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
      message: "An error occurred while fetching demandes",
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
