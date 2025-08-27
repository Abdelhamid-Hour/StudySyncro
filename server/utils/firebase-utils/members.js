const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../../firebase/firebaseAdmin");
const { getGroupById } = require("./shared");

const getFormattedMembers = (members) => {
  return members.map(({ photoURL, fullName, uid }) => ({
    photoURL,
    fullName,
    id: uid,
  }));
};

const getMembers = async (groupId, userId) => {
  try {
    const group = await getGroupById(groupId);

    if (!group) return { success: false, message: "Group not found" };
    const members =
      group.creator === userId
        ? group.members.filter((m) => m.uid != group.creator)
        : group.members;
    const formattedMembers = getFormattedMembers(members);
    return {
      success: true,
      context: {
        isAdmin: group.creator === userId,
        count: formattedMembers.length,
        formattedMembers,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "An error occurred while fetching members",
    };
  }
};

const addMember = async (groupId, userId) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    const groupSnap = await groupRef.get();
    // Check if group exists, user exists, and user is not already a member
    if (!groupSnap.exists) {
      return { message: "Group  does not exist", success: false };
    } else if (!userSnap.exists) {
      return { message: "User does not exist", success: false };
    }
    const group = groupSnap.data();
    // Ensure members is always an array
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

    return {
      message: "Joined the group successfully",
      status: "joined",
      success: true,
    };
  } catch (error) {
    console.error("Error in addMember function:", error);
    return { message: "Internal sever error", success: false };
  }
};

const kickMember = async (groupId, userId) => {
  try {
    const group = await groupId;
    const groupRef = db.collection("groups").doc(groupId);
    const user = group.members.find((membre) => membre.uid === userId);
    if (group && user) {
      await groupRef.update({
        members: FieldValue.arrayRemove(user),
        membersUids: FieldValue.arrayRemove(userId),
      });
      return {
        success: true,
        message: "Member kicked from group",
      };
    }
    return {
      success: false,
      message: "user not found",
    };
  } catch (error) {
    console.log(error.message);
    return {
      success: false,
      message: "Something went wrong",
    };
  }
};

const getFilteredUsers = (search, users) => {
  if (!search) return users;
  const lowerCaseSearch = search.toLowerCase();

  users = users.filter((doc) => {
    const fullName = doc.data().fullName.toLowerCase();
    return fullName.includes(lowerCaseSearch);
  });

  return users.map((doc) => ({
    id: doc.id,
    fullName: doc.data().fullName || "N/A",
    photoURL: doc.data().photoURL || "here//goes//a//photo//url",
  }));
};

const getUsers = async (search, count = 20, lastVisible) => {
  // get user that its name and id match the search
  try {
    if (search) {
      const userById = await db.collection("users").doc(search).get();

      if (userById.exists) {
        const data = userById.data();
        return {
          success: true,
          users: [
            {
              id: userById.id,
              fullName: data.fullName || "N/A",
              photoURL: data.photoURL || "here//goes//a//photo//url",
            },
          ],
          lastVisible: null,
        };
      }

      let users = [];
      let lastUserReached = false;

      while (users.length < count && !lastUserReached) {
        let query = db
          .collection("users")
          .orderBy("fullName")
          .limit(Number(count) * 10);

        if (lastVisible) {
          const lastVisibleDoc = await db
            .collection("users")
            .doc(lastVisible)
            .get();
          if (lastVisibleDoc.exists) {
            query = query.startAfter(lastVisibleDoc);
          }
          const usersSnapshot = await query.get();
          lastVisible =
            usersSnapshot.docs.length > 0
              ? usersSnapshot.docs[usersSnapshot.docs.length - 1].id
              : null;
          if (usersSnapshot.docs.length > 0) {
            lastUserReached = usersSnapshot.docs.length < count;
          }
          users = users.concat(
            getFilteredUsers(search, usersSnapshot.docs).slice(
              0,
              count - users.length
            )
          );
        } else {
          const usersSnapshot = await query.get();
          if (usersSnapshot.docs.length > 0)
            lastUserReached = usersSnapshot.docs.length < count;
          users = getFilteredUsers(search, usersSnapshot.docs).slice(0, count);
          lastVisible = usersSnapshot.docs[usersSnapshot.docs.length - 1].id;
        }
      }

      lastVisible = users.length === count ? users[users.length - 1].id : null;

      return { success: true, users, lastVisible };
    } else {
      return {
        success: true,
        users: [],
        lastVisible: null,
      };
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      message: "An error occurred while fetching users",
    };
  }
};

module.exports = {
  getFormattedMembers,
  getMembers,
  addMember,
  kickMember,
  getUsers,
};
