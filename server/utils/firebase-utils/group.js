const { FieldValue, FieldPath } = require("firebase-admin/firestore");
const { db, rDb } = require("../../firebase/firebaseAdmin");
const { getFormattedMembers, addMember } = require("./members");
const {
  getGroupById,
  refillSampleMembersIfNeeded,
  syncUserGroupSnapshot,
  syncUserGroupRemoval,
  saveGroupToUser,
} = require("./shared");
const { sendRequest } = require("./demandes");
const { toReadableDate } = require("../global");
const { INITIALE_LOADERS_COUNT } = require("../global");
const {
  notifyGroupDeleted,
  notifyRoleTransfer,
  notifyGroupInvite,
  updateJoinInviteNotificationStatus,
} = require("./notifications");

const createGroup = async (groupData, userData) => {
  try {
    const groupRef = db.collection("groups");
    const snapshot = await groupRef
      .where("name", "==", groupData["group-name"])
      .get();

    const newGrop = {
      name: groupData["group-name"],
      description: groupData["group-description"],
      subject: groupData.subject,
      level: groupData.level,
      maxMembers: groupData["max-members"],
      visibility: groupData.visibility,
      creationDate: new Date().toISOString(),
      creator: userData.uid,
      membersCount: 1,
      sampleMembers: [
        {
          uid: userData.uid,
          fullName: userData.fullName,
          email: userData.email,
          photoURL: userData.photoURL,
        },
      ],
      showInSearch:
        groupData.visibility === "Private" && !groupData["show-in-search"]
          ? false
          : true,
      currentSession: "",
    };

    if (!snapshot.empty) {
      return {
        success: false,
        message:
          "A group with this name already exists. Please choose another name.",
        isNative: true,
        type: "warning",
      };
    }

    const groupDoc = await groupRef.add(newGrop);
    groupDoc.collection("members").doc(userData.uid).set({
      uid: userData.uid,
      fullName: userData.fullName,
      email: userData.email,
      photoURL: userData.photoURL,
    });
    await saveGroupToUser(userData.uid, groupDoc.id, newGrop);
    return {
      success: true,
    };
  } catch (error) {
    console.log(error.message);
    return {
      success: false,
      message: "An error occurred while creating the group. Please try again.",
      isNative: false,
      type: "error",
    };
  }
};

const getFormatedGroups = (groups, userId, requestedGroupsIds) =>
  groups.map(({ membersCount, sampleMembers = [], creator, id, ...rest }) => {
    const group = {
      ...rest,
      id,
      avatars: sampleMembers.map(({ photoURL, fullName }) => ({
        photoURL,
        fullName,
      })),
      isHost: creator === userId,
      extraMembersCount: membersCount - 2,
    };
    if (group.visibility === "Private" && requestedGroupsIds) {
      group.isRequested = requestedGroupsIds.includes(id);
    }

    return group;
  });

const filterGroups = (
  userId,
  criteria,
  groups,
  availableGroups,
  joinedGroupsIds,
) => {
  return groups.filter((g) => {
    const canBeVisible =
      joinedGroupsIds && availableGroups
        ? g.creator !== userId &&
          !joinedGroupsIds.includes(g.id) &&
          g.showInSearch === true
        : true;

    const matchLevel =
      !criteria.level?.length ||
      criteria.level.some((l) => l?.toLowerCase() === g.level?.toLowerCase());

    const matchVisibility =
      !criteria.visibility?.length ||
      criteria.visibility.some(
        (v) => v?.toLowerCase() === g.visibility?.toLowerCase(),
      );

    let matchShowInSearch = true;

    if (availableGroups) matchShowInSearch = g.showInSearch; // Default to true if undefined

    let matchJoinable = true;

    if (criteria.joinableOnly) {
      matchJoinable = g.maxMembers > g.membersCount;
    }

    let matchRole = true;

    if (!availableGroups) {
      matchRole =
        !criteria.role?.length ||
        (criteria.role.some((r) => r?.toLowerCase() === "admin") &&
          userId === g.creator) ||
        (criteria.role.some((r) => r?.toLowerCase() === "member") &&
          userId != g.creator);
    }

    let matchSearch = true;
    const searchTerm = criteria.searchTerm?.trim().toLowerCase() || "";

    if (searchTerm) {
      matchSearch =
        g.subject?.toLowerCase().includes(searchTerm) ||
        g.name?.toLowerCase().includes(searchTerm);
    }

    const result =
      canBeVisible &&
      matchLevel &&
      matchVisibility &&
      matchShowInSearch &&
      matchJoinable &&
      matchSearch &&
      matchRole;

    return result;
  });
};

const getAvailableGroups = async (
  userId,
  criteria = {
    level: [],
    visibility: [],
    available: false,
    role: [],
    searchTerm: "",
    searchBy: "",
  },
  limit = INITIALE_LOADERS_COUNT,
  lastVisible = null,
) => {
  try {
    let availableGroups = [];
    const userRef = db.collection("users").doc(userId);
    const requestedGroupsSnap = await userRef.collection("sentRequests").get();
    const requestedGroupsIds = requestedGroupsSnap.docs
      .filter((doc) => doc.data().status === "pending")
      .map((doc) => doc.id);
    const joinedGroupsSnap = await userRef
      .collection("userGroups")
      .select()
      .get();
    const joinedGroupsIds = joinedGroupsSnap.empty
      ? []
      : joinedGroupsSnap.docs.map((doc) => doc.id);
    do {
      const batchSize = Number(limit) * 10;
      let query = db
        .collection("groups")
        .orderBy("creationDate", criteria.sort || "desc")
        .limit(batchSize);

      // support lastVisible as a doc id (string)
      if (lastVisible) {
        const lastVisibleDoc = await db
          .collection("groups")
          .doc(lastVisible)
          .get();
        if (lastVisibleDoc.exists) {
          query = query.startAfter(lastVisibleDoc);
        } else {
          // can't page further if doc not found
          lastVisible = null;
          break;
        }
      }

      const snapshot = await query.get();

      const groups = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // safe filter: guard membersUids and use strict equality

      const remaining = limit - availableGroups.length;
      availableGroups = availableGroups.concat(
        filterGroups(userId, criteria, groups, true, joinedGroupsIds).slice(
          0,
          remaining,
        ),
      );

      lastVisible =
        snapshot.docs.length === batchSize
          ? snapshot.docs[snapshot.docs.length - 1].id
          : null;
    } while (availableGroups.length < limit && lastVisible !== null);

    const groupsToReturn = availableGroups.slice(0, limit);
    const finalCards = getFormatedGroups(
      groupsToReturn,
      userId,
      requestedGroupsIds,
    );

    // return id of last returned group if we filled the requested limit, else null
    const finalLastVisible =
      groupsToReturn.length === limit
        ? groupsToReturn[groupsToReturn.length - 1].id
        : null;

    return { cards: finalCards, lastVisible: finalLastVisible };
  } catch (error) {
    console.error("Error in getAvailableGroups:", error);
    return { cards: [], lastVisible: null };
  }
};

const getJoinedGroups = async (
  userId,
  criteria = {
    level: [],
    visibility: [],
    available: false,
    role: [],
    searchTerm: "",
    searchBy: "",
  },
  limit = INITIALE_LOADERS_COUNT,
  lastVisible = null,
) => {
  try {
    let joinedGroups = [];

    const batchSize = Number(limit) * 10;

    do {
      let query = db
        .collection("users")
        .doc(userId)
        .collection("userGroups")
        .orderBy("creationDate", criteria.sort || "desc")
        .limit(batchSize);

      // Handle pagination
      if (lastVisible) {
        const lastVisibleDoc = await db
          .collection("users")
          .doc(userId)
          .collection("userGroups")
          .doc(lastVisible)
          .get();
        if (lastVisibleDoc.exists) {
          query = query.startAfter(lastVisibleDoc);
        } else {
          // If lastVisible doc doesn't exist, we cannot paginate further
          lastVisible = null;
          break;
        }
      }

      const snapshot = await query.get();
      if (snapshot.empty && joinedGroups.length === 0) {
        return { cards: [], lastVisible: null };
      }

      // Convert docs to objects
      const groups = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Add up to remaining needed groups
      const remaining = limit - joinedGroups.length;
      joinedGroups = joinedGroups.concat(
        filterGroups(userId, criteria, groups).slice(0, remaining),
      );

      // Update lastVisible for next page
      lastVisible =
        snapshot.docs.length === batchSize
          ? snapshot.docs[snapshot.docs.length - 1].id
          : null;

      // Continue while we still need more and there is a next page
    } while (joinedGroups.length < limit && lastVisible !== null);

    // Prepare final results
    const finalCards = getFormatedGroups(joinedGroups, userId);

    // Return lastVisible similar to getUsers style
    const finalLastVisible =
      joinedGroups.length === limit
        ? joinedGroups[joinedGroups.length - 1].id
        : null;

    return { cards: finalCards, lastVisible: finalLastVisible };
  } catch (error) {
    console.error("Error in getJoinedGroups:", error);
    return { cards: [], lastVisible: null };
  }
};

/**
 * [1, 2, 3, 4, 5, 6]
 * [2, 4, 6]
 */

const leaveGroup = async (groupId, userId) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();
    const userRef = db.collection("users").doc(userId);
    const memberSnap = await groupRef.collection("members").doc(userId).get();
    if (!groupSnap.exists)
      return {
        success: false,
        message: "Group not found",
        isNative: true,
        type: "info",
      };

    if (!memberSnap.exists) {
      return {
        success: false,
        message: "User not found",
        isNative: true,
        type: "info",
      };
    }

    await memberSnap.ref.delete();
    await groupRef.update({
      membersCount: FieldValue.increment(-1),
    });
    await userRef.collection("userGroups").doc(groupId).delete();
    await syncUserGroupSnapshot(groupId, {
      membersCount: FieldValue.increment(-1),
    });
    await refillSampleMembersIfNeeded(groupRef);

    if (groupSnap.data().currentSession) {
      await userRef
        .collection("activeSessions")
        .doc(groupSnap.data().currentSession)
        .delete();
      const userSnap = await userRef.get();
      if (
        userSnap.exists &&
        userSnap.data().currentSession === groupSnap.data().currentSession
      ) {
        const { leavSession } = require("./session");
        await leavSession(userId);
      }
    }
    await rDb
      .ref(`userGroupChats/${userId}/${groupId}`)
      .remove()
      .catch((e) => console.error(e));

    return {
      success: true,
      message: "Left the group",
    };
  } catch (error) {
    console.log(error.message);
    return {
      success: false,
      message: "cant leave groupe , something went wrong",
      isNative: false,
      type: "error",
    };
  }
};

const modifyGroup = async (userId, groupId, formData) => {
  try {
    const groupRes = await getGroupById(groupId);
    const groupRef = db.collection("groups").doc(groupId);
    const snaphsot = await groupRef.get();
    if (!groupRes.success) return groupRes;
    const group = groupRes.group;
    let isAdmin = true;
    isAdmin = group.creator === userId;
    if (!isAdmin) {
      return {
        success: false,
        message: "you dont have the right to upate the group informations.",
        isNative: true,
        type: "warning",
      };
    }

    const fieldName = formData.fieldName;
    const value = formData.value;
    // hnaya acheck using the keys to inssure that there is fileds to upddate heheh
    if (fieldName === "visibility") {
      if (value.visibility) {
        await groupRef.update({
          visibility: value.visibility,
        });
        return {
          success: true,
          message: `Group visibility updated successfully.`,
        };
      } else if (value.showInSearch) {
        await groupRef.update({
          showInSearch: value.showInSearch,
        });
        return {
          success: true,
          message: `Groupe privacy  updated successfully.`,
        };
      }
    } else if (
      (fieldName != "" && fieldName != "visibility") ||
      value != "" ||
      snaphsot.exists
    ) {
      await groupRef.update({
        [fieldName]: value,
      });
      return {
        success: true,
        message: `Group ${fieldName} updated successfully.`,
      };
    } else {
      return {
        success: false,
        message: "No changes detected, skipping update.",
        isNative: true,
        type: "info",
      };
    }
  } catch (error) {
    console.error("Error in modifyGroup:", error.message);
    return {
      success: false,
      message: "Can't update group properties ! please try again later.",
      isNative: false,
      type: "error",
    };
  }
};

const updateGroupProperty = async (groupId, property, newValue) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) {
      return {
        success: false,
        message: "Group not found",
        isNative: true,
        type: "info",
      };
    }

    // Map of valid properties, their Firestore field name, and verification/sanitization logic
    const propertyMap = {
      name: {
        field: "name",
        validate: async (val) => {
          if (typeof val !== "string" || val.trim() === "") {
            return { valid: false, message: "Group name cannot be empty" };
          }
          const cleaned = val.trim();
          const snapshot = await db
            .collection("groups")
            .where("name", "==", cleaned)
            .limit(2)
            .get();
          const isDuplicated = snapshot.docs.some((doc) => doc.id !== groupId);
          if (isDuplicated) {
            return {
              valid: false,
              message: "A group with this name already exists",
            };
          }
          return { valid: true, value: cleaned };
        },
      },
      description: {
        field: "description",
        validate: (val) => {
          if (typeof val !== "string" || val.trim() === "") {
            return { valid: false, message: "Description cannot be empty" };
          }
          return { valid: true, value: val.trim() };
        },
      },
      creator: {
        field: "creator",
        validate: (val) => {
          if (typeof val !== "string" || val.trim() === "") {
            return { valid: false, message: "Creator ID cannot be empty" };
          }
          return { valid: true, value: val.trim() };
        },
      },
      subject: {
        field: "subject",
        validate: (val) => {
          if (typeof val !== "string" || val.trim() === "") {
            return { valid: false, message: "Subject cannot be empty" };
          }
          return { valid: true, value: val.trim() };
        },
      },
      level: {
        field: "level",
        validate: (val) => {
          if (typeof val !== "string" || val.trim() === "") {
            return { valid: false, message: "Level cannot be empty" };
          }
          return { valid: true, value: val.trim() };
        },
      },
      visibility: {
        field: "visibility",
        validate: (val) => {
          if (typeof val !== "string" || val.trim() === "") {
            return { valid: false, message: "Visibility cannot be empty" };
          }
          return { valid: true, value: val.trim() };
        },
      },
      maxMembers: {
        field: "maxMembers",
        validate: (val) => {
          if (val === null || val === undefined || val === "") {
            return { valid: false, message: "Max members cannot be empty" };
          }
          const num = Number(val);
          if (isNaN(num) || num <= 0) {
            return {
              valid: false,
              message: "Max members must be a positive number",
            };
          }
          return { valid: true, value: num };
        },
      },
      showInSearch: {
        field: "showInSearch",
        validate: (val) => {
          let boolValue;
          if (typeof val === "boolean") {
            boolValue = val;
          } else if (typeof val === "string") {
            boolValue = val.toLowerCase() === "true";
          } else {
            return { valid: false, message: "Invalid value for showInSearch" };
          }
          return { valid: true, value: boolValue };
        },
      },
    };

    const propConfig = propertyMap[property];
    if (!propConfig) {
      return {
        success: false,
        message: "Invalid property type",
        isNative: true,
        type: "warning",
      };
    }

    const validation = await propConfig.validate(newValue);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.message,
        isNative: true,
        type: "warning",
      };
    }

    await groupRef.update({
      [propConfig.field]: validation.value,
    });

    if (!["maxMembers", "showInSearch", "currentSession"].includes(property))
      await syncUserGroupSnapshot(groupId, {
        [propConfig.field]: validation.value,
      });

    if (propConfig.field === "creator") {
      await notifyRoleTransfer(
        groupId,
        groupDoc.data().name,
        groupDoc.data().creator,
        validation.value,
      );
    }

    return {
      success: true,
      message: "Updated successfully",
    };
  } catch (error) {
    console.error(`Error in updateGroupProperty: ${error.message}`);
    return {
      success: false,
      message: "An error occurred while updating the group property",
      isNative: false,
      type: "error",
    };
  }
};

const deleteGroup = async (groupId) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupRes = await getGroupById(groupId);

    if (!groupRes.success) return groupRes;

    if (groupRes.group.currentSession && groupRes.group.currentSession !== "") {
      return {
        success: false,
        message:
          "You cannot delete this group while an active study session is running. Please end the session first.",
        isNative: true,
        type: "warning",
      };
    }

    const membersSnap = await groupRef.collection("members").get();
    const memberIds = membersSnap.docs.map((doc) => doc.id);

    await syncUserGroupRemoval(groupId);
    await groupRef.delete();
    await notifyGroupDeleted(memberIds, groupId, groupRes.group.name);
    await rDb
      .ref(`groups/${groupId}/chat`)
      .remove()
      .catch((e) => console.error(e));
    for (const memberId of memberIds) {
      await rDb
        .ref(`userGroupChats/${memberId}/${groupId}`)
        .remove()
        .catch((e) => console.error(e));
    }

    return { success: true, message: "Group removed" };
  } catch (error) {
    console.log(error.message);
    return {
      success: false,
      message: "Error removing group",
      isNative: false,
      type: "error",
    };
  }
};

const getGroupInfo = async (groupId, userId) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();

    if (!groupSnap.exists)
      return {
        success: false,
        message: "Group not found",
        isNative: true,
        type: "info",
      };
    const group = groupSnap.data();
    const adminInfo = (
      await groupRef.collection("members").doc(group.creator).get()
    ).data();
    const membersSnap = await groupRef.collection("members").limit(5).get();
    const members = membersSnap.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));

    const requestsCountSnap = await groupRef
      .collection("requests")
      .count()
      .get();

    const requestsCount = requestsCountSnap.data().count;

    return {
      success: true,
      context: {
        groupName: group.name,
        groupDescription: group.description,
        subject: group.subject,
        level: group.level,
        visibility: group.visibility,
        showInSearch: group.showInSearch,
        maxMembers: Number(group.maxMembers),
        creationDate: toReadableDate(group.creationDate, "short"),
        demandesCount: requestsCount,
        Admin: {
          fullName: adminInfo.fullName,
          photoURL: adminInfo.photoURL,
        },
        members: getFormattedMembers(members),
        isAdmin: group.creator === userId,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "An error occurred while fetching group info. Please try again.",
      isNative: false,
      type: "error",
    };
  }
};

const getChatContext = async (userId, groupId) => {
  try {
    const groupRes = await getGroupById(groupId);

    if (!groupRes.success)
      return {
        ...groupRes,
        statusCode: 404,
      };

    const group = groupRes.group;

    if (!group)
      return {
        success: false,
        statusCode: 404,
        message: "Group Not Found",
        isNative: true,
        type: "info",
      };

    const userRef = db.collection("users").doc(userId);

    const isMember = await userRef.collection("userGroups").doc(groupId).get();

    if (!isMember.exists)
      return {
        success: false,
        statusCode: 401,
        message: "You are not a member of this group",
        isNative: true,
        type: "warning",
      };

    const sessionSnap = group.currentSession
      ? await db.collection("sessions").doc(group.currentSession).get()
      : null;

    let joined = false;
    if (sessionSnap && sessionSnap.exists) {
      joined = sessionSnap.data().joinedUsers?.includes(userId);
    }

    return {
      success: true,
      templateContext: {
        groupName: group.name,
        isAdmin: group.creator === userId,
        sessionId: group.currentSession,
        isRequested: group.visibility === "Private" && group.showInSearch,
        joined,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      statusCode: 500,
      message: "Cannot fetch data , please try again later !.",
      isNative: false,
      type: "error",
    };
  }
};

const joinGroup = async (groupId, userData, isInvite = false) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();

    if (!groupSnap.exists) {
      return {
        success: false,
        message: "Group does not exist",
        isNative: true,
        type: "info",
      };
    }

    const group = groupSnap.data();

    if (group.visibility === "Public" || isInvite) {
      // Directly add member for public groups or when joining via invitation
      const result = await addMember(groupRef, userData.uid);
      if (result.success) {
        await updateJoinInviteNotificationStatus(
          userData.uid,
          groupId,
          "accepted",
        );
      }
      return result;
    }

    if (group.visibility === "Private" && group.showInSearch) {
      // Send join request for private groups that are discoverable
      return await sendRequest(groupId, userData);
    }

    return {
      success: false,
      message: "You cannot join this group.",
      isNative: true,
      type: "info",
    };
  } catch (error) {
    console.error("Error in joinGroup:", error);
    return {
      success: false,
      message: "Internal server error",
      isNative: false,
      type: "error",
    };
  }
};

const inviteMembers = async (groupId, users, senderUserData) => {
  try {
    if (!groupId || !users || !Array.isArray(users) || users.length === 0) {
      return {
        success: false,
        message: "Invalid parameters",
        isNative: true,
        type: "warning",
      };
    }

    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();
    if (!groupSnap.exists) {
      return {
        success: false,
        message: "Group does not exist",
        isNative: true,
        type: "info",
      };
    }

    const groupData = groupSnap.data();
    const groupName = groupData.name || "a group";
    const members = groupData.members || [];

    let senderUser = senderUserData;
    if (senderUserData && typeof senderUserData === "string") {
      const senderSnap = await db.collection("users").doc(senderUserData).get();
      senderUser = senderSnap.exists
        ? { uid: senderSnap.id, ...senderSnap.data() }
        : { uid: senderUserData, fullName: "Admin" };
    } else if (!senderUser) {
      senderUser = { uid: groupData.creator, fullName: "Admin" };
    }

    const invitePromises = [];
    for (const u of users) {
      const targetUserId = typeof u === "object" ? u.id || u.uid : u;
      if (!targetUserId) continue;
      if (
        members.includes(targetUserId) ||
        groupData.creator === targetUserId
      ) {
        continue;
      }
      invitePromises.push(
        notifyGroupInvite(groupId, groupName, senderUser, targetUserId),
      );
    }

    await Promise.all(invitePromises);
    return { success: true };
  } catch (error) {
    console.error("Error in inviteMembers:", error);
    return {
      success: false,
      message: "Failed to invite members",
      isNative: false,
      type: "error",
    };
  }
};

const rejectInvite = async (groupId, userId) => {
  try {
    await updateJoinInviteNotificationStatus(userId, groupId, "rejected");
    return { success: true, message: "Invitation rejected successfully." };
  } catch (error) {
    console.error("Error in rejectInvite:", error);
    return {
      success: false,
      message: "Failed to reject invitation.",
      isNative: false,
      type: "error",
    };
  }
};

module.exports = {
  leaveGroup,
  getGroupInfo,
  joinGroup,
  createGroup,
  getAvailableGroups,
  getJoinedGroups,
  modifyGroup,
  updateGroupProperty,
  deleteGroup,
  getChatContext,
  inviteMembers,
  rejectInvite,
};
