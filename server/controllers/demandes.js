const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../firebase/firebaseAdmin");

const ajouterMembre = async (groupId, userId) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    const groupSnap = await groupRef.get();
    console.log(userSnap, "user data from the database");
    // Check if group exists, user exists, and user is not already a member
    if (!groupSnap.exists || !userSnap.exists) {
      console.log("Group or user not found");
      return false;
    }
    const group = groupSnap.data();
    // Ensure membres is always an array
    group.membres = Array.isArray(group.membres) ? group.membres : [];
    const maxMembre = group.membres.length >= group.nombre_max_membres;
    if (maxMembre) {
      console.log("le groupe est plein");
      return false;
    }
ù
    const userData = userSnap.data();


    const isAlreadyMember = group.membres.some(
      (membre) => membre.uid === userId
    );

    if (isAlreadyMember) {
      console.log("User is already a member");
      return false;
    }

    // Add user to group members
    await groupRef.update({
      membres: FieldValue.arrayUnion({
        uid: userId,
        name: userData.name || userData.displayName || "Utilisateur",
        email: userData.email || "",
        photoURL:
          userData.picture || userData.photoURL || "here//goes//a//photo//url",
      }),
    });

    console.log("Member added successfully");
    return true;
  } catch (error) {
    console.error("Error in ajouterMembre function:", error);
    return false;
  }
};


const sendRequest = async (groupId, userData) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();

    if (groupSnap.exists) {
      const group = groupSnap.data();
      if (group.nombre_max_membres <= group.membres.length) {
        return 0;
      } else if (
        group.demandes.some((demande) => demande.uid === userData.uid)
      ) {
        return 1;
      } else if (group.membres.some((membre) => membre.uid === userData.uid)) {
        return 2;
      } else {
        await groupRef.update({
          demandes: FieldValue.arrayUnion({
            uid: userData.uid,
            name: userData.name,
            email: userData.email,
            photoURL: userData.picture || "here//goes//a//photo//url",
          }),
        });
        return true;
      }
    } else {
      return 3;
    }
  } catch (error) {
    console.log(error.message);
    return false;
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
      const request = group.demandes.find(
        (demande) => demande.uid === requestId
      );
      if (request) {
        await groupRef.update({
          demandes: FieldValue.arrayRemove(request),
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
      return group.membres;
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
    const user = group.membres.find((membre) => membre.uid === userId);
    if (group && user) {
      await groupRef.update({
        membres: FieldValue.arrayRemove(user),
      });
      return true;
    }
    return false;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};


module.exports = {kickMember , sendRequest , acceptRequest , rejectRequest , getMembres , ajouterMembre}