const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../../firebase/firebaseAdmin");
const { getGroupById } = require("./shared");

const sendRequest = async (groupId, userData) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();
    const data = groupSnap.data();
    if (groupSnap.exists) {
      const group = groupSnap.data();

      if (group.maxMembers <= group.members.length) {
        return {
          message: "Can't send request the group is full",
          success: false,
        };
      } else if (
        group.requests.some((demande) => demande.uid === userData.uid)
      ) {
        return { message: "You have already sent a request", success: false };
      } else if (group.members.some((member) => member.uid === userData.uid)) {
        return {
          message: "You are already a member ",
          success: false,
        };
      } else if (data.showInSearch) {
        await groupRef.update({
          requests: FieldValue.arrayUnion({
            uid: userData.uid,
            name: userData.fullName,
            email: userData.email,
            photoURL: userData.picture || "here//goes//a//photo//url",
            sentAt: new Date().toISOString(),
          }),
        });
        return {
          message: "Can't send request the group is full",
          status: "requested",
          success: true,
        };
      } else {
      }
    } else {
      return {
        message: "Group does not exists",
        success: false,
      };
    }
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const acceptRequest = async (groupId, requestId, userId) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);

    const result = await db.runTransaction(async (transaction) => {
      const groupDocSnapshot = await transaction.get(groupRef);

      if (!groupDocSnapshot.exists) {
        return {
          success: false,
          message: `Group with ID ${groupId} not found.`,
        };
      }

      const groupData = groupDocSnapshot.data();

      if (groupData.creator !== userId) {
        return {
          success: false,
          message: "Only the group creator can accept requests.",
        };
      }

      const requestToAccept = groupData.requests.find(
        (demande) => demande.uid === requestId
      );

      if (!requestToAccept) {
        return { success: false, message: "Join request not found." };
      }

      const newMember = {
        uid: requestToAccept.uid,
        fullName: requestToAccept.name,
        email: requestToAccept.email,
        photoURL: requestToAccept.photoURL,
      };

      const isAlreadyMember = groupData.members.some(
        (member) => member.uid === newMember.uid
      );

      if (isAlreadyMember) {
        transaction.update(groupRef, {
          requests: FieldValue.arrayRemove(requestToAccept),
        });
        return {
          success: true,
          message: "User is already a member, request removed.",
        };
      }

      transaction.update(groupRef, {
        members: FieldValue.arrayUnion(newMember),
        requests: FieldValue.arrayRemove(requestToAccept),
      });

      return { success: true, message: "Join request accepted successfully!" };
    });

    return result;
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
    const group = await getGroupById(groupId);
    if (group && group.creator === userId) {
      const request = group.requests.find(
        (demande) => demande.uid === requestId
      );
      if (request) {
        await groupRef.update({
          requests: FieldValue.arrayRemove(request),
        });
        return {
          success: true,
          message: "Request rejected successfully.",
        };
      } else {
        return {
          success: false,
          message: "No Request match ",
        };
      }
    } else {
      return {
        success: false,
        message:
          "No group found or user does not have the right to accomplish the action",
      };
    }
  } catch (error) {
    console.log(error.message);
    return {
      success: false,
      message: "Something wrong happened ",
    };
  }
};

const getFormatedRequests = (requests) =>
  requests.map(({ id, name, photoURL, sentAt }) => ({
    usuerId: id,
    fullName: name,
    photoURL,
    demandeDate: sentAt,
  }));

const getRequests = async (groupId, userId) => {
  try {
    const group = await getGroupById(groupId);
    if (!group) return { success: false, message: "Group not found" };
    const requests = getFormatedRequests(group.requests);
    return {
      success: true,
      context: {
        count: requests.length,
        isAdmin: group.creator === userId,
        demandes: requests,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "An error occurred while fetching requests",
    };
  }
};

module.exports = {
  getRequests,
  acceptRequest,
  rejectRequest,
};
