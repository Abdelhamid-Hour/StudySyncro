const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../../firebase/firebaseAdmin");

const ajouterMembre = async (groupId, userId) => {
  try {
    console.log(groupId, "group id ");
    const groupRef = db.collection("groups").doc(groupId);
    console.log("userIs", userId);
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    const groupSnap = await groupRef.get();
    console.log(userSnap, "user data from the database");
    // Check if group exists, user exists, and user is not already a member
    if (!groupSnap.exists) {
      return { message: "Group  does not exist", success: false };
    } else if (!userSnap.exists) {
      return { message: "User does not exist", success: false };
    }
    const group = groupSnap.data();
    // Ensure membres is always an array
    const maxMembre = group.members.length >= group.maxMembers;
    if (maxMembre) {
      return { message: "Group is full", success: false };
    }
    const userData = userSnap.data();

    const isAlreadyMember = group.members.some(
      (membre) => membre.uid === userId
    );

    if (isAlreadyMember) {
      return { message: "You are already a member", success: false };
    }

    // Add user to group members
    await groupRef.update({
      members: FieldValue.arrayUnion({
        uid: userId,
        fullName: userData.fullName || userData.displayName || "Utilisateur",
        email: userData.email || "",
        photoURL:
          userData.picture || userData.photoURL || "here//goes//a//photo//url",
      }),
      membersUids: FieldValue.arrayUnion(userId),
    });

    console.log("Member added successfully");
    return {
      message: "Joined the group successfully",
      status: "joined",
      success: true,
    };
  } catch (error) {
    console.error("Error in ajouterMembre function:", error);
    return { message: "Internal sever error", success: false };
  }
};

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
      } else if (group.members.some((membre) => membre.uid === userData.uid)) {
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

const joinGroup = async (groupId, userData) => {
  try {
    const ref = db.collection("groups").doc(groupId);
    const snaphsot = await ref.get();

    if (snaphsot.exists) {
      const group = snaphsot.data();

      if (group.visibility === "Public") {
        return (result = await ajouterMembre(groupId, userData.uid));
      } else if (group.showInSearch && group.visibility === "Private") {
        return (result = await sendRequest(groupId, userData));
      }
    } else {
      return {
        message: "Group does not exist",
        success: false,
      };
    }
  } catch (error) {
    console.error(error);
    return { message: "Internal server error", success: false };
  }
};
const acceptRequest = async (groupId, requestId) => {
  try {
    const group = await getGroupByID(groupId);
    const groupRef = db.collection("groups").doc(groupId);
    const request = group.demandes.find((demande) => demande.uid === requestId);
    console.log("request", group.demandes);
    if (group) {
      if (group.demandes.some((demande) => demande.uid === requestId)) {
        await groupRef.update({
          membres: FieldValue.arrayUnion({
            uid: request.uid,
            name: request.name,
            email: request.email,
            photoURL: request.photoURL,
          }),
        });
        groupRef.update({
          demandes: FieldValue.arrayRemove(request),
        });
        return true;
      } else {
        return false;
      }
    }
  } catch (error) {
    console.log(error.message);
    return false;
  }
};
const rejectRequest = async (groupId, requestId) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const group = await getGroupByID(groupId);
    if (group) {
      const request = group.requests.find(
        (demande) => demande.uid === requestId
      );
      if (request) {
        await groupRef.update({
          requests: FieldValue.arrayRemove(request),
        });
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const getMembres = async (groupId) => {
  try {
    const group = await getGroupByID(groupId);
    if (group) {
      return group.members;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};

const kickMember = async (groupId, userId) => {
  try {
    const group = await getGroupByID(groupId);
    const groupRef = db.collection("groups").doc(groupId);
    const user = group.members.find((membre) => membre.uid === userId);
    if (group && user) {
      await groupRef.update({
        members: FieldValue.arrayRemove(user),
      });
      return true;
    }
    return false;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

module.exports = {
  kickMember,
  acceptRequest,
  rejectRequest,
  getMembres,
  joinGroup,
};
