const { FieldValue } = require("firebase-admin/firestore");
const { db, rDb } = require("../../firebase/firebaseAdmin");
const {
  refillSampleMembersIfNeeded,
  syncUserGroupSnapshot,
  saveGroupToUser,
} = require("./shared");
const { INITIALE_LOADERS_COUNT } = require("../global");
const { notifyMemberRemoved } = require("./notifications");

const getFormattedMembers = (members, creator, isAdmin) => {
  return members.map(({ photoURL, fullName, uid }) => ({
    photoURL,
    fullName,
    id: uid,
    isAdmin: uid === creator,
    userIsAdmin: isAdmin,
  }));
};

const getFilteredMembers = (search, members, creator, isAdmin) => {
  if (!search) return getFormattedMembers(members, creator, isAdmin);
  const lowerSearch = search.trim().toLowerCase();
  const filteredMembers = members.filter((m) =>
    m.fullName?.toLowerCase().includes(lowerSearch),
  );
  return getFormattedMembers(filteredMembers, creator, isAdmin);
};

const getMembers = async (
  search,
  groupId,
  userId,
  limit = INITIALE_LOADERS_COUNT,
  lastVisible = null,
) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();

    if (!groupSnap.exists) {
      return {
        success: false,
        message: "Group not found",
        isNative: true,
        type: "info",
      };
    }
    const creator = groupSnap.data().creator;
    const isAdmin = creator === userId;
    let members = [];

    // Fast path: if search looks like a member id, try fetching that doc directly
    if (search) {
      const maybeDoc = await groupRef.collection("members").doc(search).get();
      if (maybeDoc.exists) {
        const m = { uid: maybeDoc.id, ...maybeDoc.data() };
        const formatted = getFormattedMembers([m], creator, isAdmin);
        return {
          success: true,
          isAdmin,
          count: formatted.length,
          cards: formatted,
          lastVisible: null,
        };
      }
    }

    // Iteratively fetch batches until we collect `limit` filtered members or no more pages
    do {
      const batchSize = Number(limit) * 10;
      // ORDER BY: adjust the field if your member docs don't have `fullName`
      let query = groupRef
        .collection("members")
        .orderBy("fullName")
        .limit(batchSize);

      if (lastVisible) {
        const lastDoc = await groupRef
          .collection("members")
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
      const fetched = snapshot.docs.map((d) => ({ uid: d.id, ...d.data() }));

      // Filter the fetched batch using your search criteria helper
      const filteredBatch = getFilteredMembers(
        search,
        fetched,
        creator,
        isAdmin,
      );

      // Add only what's remaining to reach `limit`
      const remaining = limit - members.length;
      members = members.concat(filteredBatch.slice(0, remaining));

      // If we fetched a full batch, there may be more pages; else no more pages
      lastVisible =
        snapshot.docs.length === batchSize
          ? snapshot.docs[snapshot.docs.length - 1].id
          : null;
    } while (members.length < limit && lastVisible !== null);

    const finalLastVisible =
      members.length === limit ? members[members.length - 1].id : null;

    return {
      success: true,
      isAdmin,
      count: members.length,
      cards: members,
      lastVisible: finalLastVisible,
    };
  } catch (error) {
    console.error("Error in getMembers:", error);
    return {
      success: false,
      message: "An error occurred while fetching members",
      isNative: false,
      type: "error",
    };
  }
};

const addMember = async (groupRef, userId) => {
  try {
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    const groupSnap = await groupRef.get();

    const group = groupSnap.data();
    // Ensure members is always an array
    const membersCount = (
      await groupRef.collection("members").count().get()
    ).data().count;
    const maxMembers = membersCount >= group.maxMembers;

    if (maxMembers) {
      return {
        message: "Group is full",
        success: false,
        isNative: true,
        type: "info",
      };
    }

    const userData = userSnap.data();

    const isAlreadyMember = (
      await groupRef.collection("members").doc(userId).get()
    ).exists;

    if (isAlreadyMember) {
      return {
        message: "You are already a member",
        success: false,
        isNative: true,
        type: "info",
      };
    }

    // Add user to group members
    await groupRef.collection("members").doc(userId).set({
      uid: userId,
      fullName: userData.fullName,
      email: userData.email,
      photoURL: userData.photoURL,
    });
    await groupRef.update({
      membersCount: FieldValue.increment(1),
    });
    await saveGroupToUser(userId, groupRef.id, group);
    await syncUserGroupSnapshot(groupRef.id, {
      membersCount: FieldValue.increment(1),
    });
    await refillSampleMembersIfNeeded(groupRef);

    if (group.currentSession) {
      const sessionSnap = await db
        .collection("sessions")
        .doc(group.currentSession)
        .get();
      if (sessionSnap.exists) {
        const sData = sessionSnap.data();
        await userRef
          .collection("activeSessions")
          .doc(group.currentSession)
          .set({
            name: sData.name || "",
            description: sData.description || "",
            duration: sData.duration || 0,
            startDate: sData.startDate || "",
            groupName: sData.groupName || "",
            tasksCount: sData.tasksCount || 0,
            joinedCount: sData.joinedCount || 0,
          });
      }
    }

    return {
      success: true,
      status: "joined",
    };
  } catch (error) {
    console.error("Error in addMember function:", error);
    return {
      message: "Internal sever error",
      success: false,
      isNative: false,
      type: "error",
    };
  }
};

const kickMember = async (groupId, userId) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();
    const memberSnap = await groupRef.collection("members").doc(userId).get();
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!groupSnap.exists) {
      return {
        success: false,
        message: "Group not found",
        isNative: true,
        type: "info",
      };
    }
    if (!memberSnap.exists) {
      return {
        success: false,
        message: "User not found",
        isNative: true,
        type: "info",
      };
    }
    await memberSnap.ref.delete();
    await db
      .collection("users")
      .doc(userId)
      .collection("userGroups")
      .doc(groupId)
      .delete();
    await groupRef.update({
      membersCount: FieldValue.increment(-1),
      sampleMembers: FieldValue.arrayRemove({
        uid: userSnap.id,
        fullName: userSnap.data().fullName,
        email: userSnap.data().email,
        photoURL: userSnap.data().photoURL,
      }),
    });
    await syncUserGroupSnapshot(groupId, {
      membersCount: FieldValue.increment(-1),
    });

    // Refill sampleMembers if less than 3
    await refillSampleMembersIfNeeded(groupRef);

    if (groupSnap.data().currentSession) {
      await userRef
        .collection("activeSessions")
        .doc(groupSnap.data().currentSession)
        .delete();
    }
    await rDb
      .ref(`userGroupChats/${userId}/${groupId}`)
      .remove()
      .catch((e) => console.error(e));

    await notifyMemberRemoved(userId, groupId, groupSnap.data().name);

    return {
      success: true,
      message: "Member kicked from group",
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Something went wrong",
      isNative: false,
      type: "error",
    };
  }
};

const getFilteredUsers = (search, users, memberIds) => {
  if (!search) return users;
  const lowerCaseSearch = search.trim().toLowerCase();

  users = users.filter((doc) => {
    const fullName = doc.data().fullName?.toLowerCase() || "";
    return fullName.includes(lowerCaseSearch);
  });

  return users.map((doc) => ({
    id: doc.id,
    fullName: doc.data().fullName || "N/A",
    photoURL: doc.data().photoURL,
    isAlreadyMember: memberIds.includes(doc.id) || false,
  }));
};

const getUsers = async (
  search,
  count = INITIALE_LOADERS_COUNT,
  lastVisible,
  groupId,
) => {
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
              photoURL: data.photoURL,
            },
          ],
          lastVisible: null,
        };
      }

      let users = [];

      const membersSnap = await db
        .collection("groups")
        .doc(groupId)
        .collection("members")
        .get();

      const memberIds = membersSnap.empty
        ? []
        : membersSnap.docs.map((doc) => doc.id);

      do {
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
          } else {
            lastVisible = null;
            break;
          }
        }
        const usersSnapshot = await query.get();
        users = users.concat(
          getFilteredUsers(search, usersSnapshot.docs, memberIds).slice(
            0,
            count - users.length,
          ),
        );
        lastVisible =
          usersSnapshot.docs.length === Number(count) * 10
            ? usersSnapshot.docs[usersSnapshot.docs.length - 1].id
            : null;
      } while (users.length < count && lastVisible !== null);

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
      isNative: false,
      type: "error",
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
