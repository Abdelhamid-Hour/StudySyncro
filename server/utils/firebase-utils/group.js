const { FieldValue, FieldPath } = require("firebase-admin/firestore");
const { db } = require("../../firebase/firebaseAdmin");
const { getFormattedMembers, addMember } = require("./members");
const { getGroupById, refillSampleMembersIfNeeded } = require("./shared");
const { sendRequest } = require("./demandes");
const { toReadableDate } = require("../global");
const { INITIALE_LOADERS_COUNT } = require("../global");

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
      };
    }

    const groupDoc = await groupRef.add(newGrop);
    groupDoc.collection("members").doc(userData.uid).set({
      uid: userData.uid,
      fullName: userData.fullName,
      email: userData.email,
      photoURL: userData.photoURL,
    });
    const userRef = db.collection("users").doc(userData.uid);
    await userRef.collection("userGroupsIds").doc(groupDoc.id).set({});
    return {
      success: true,
    };
  } catch (error) {
    console.log(error.message);
    return {
      success: false,
      message: "An error occurred while creating the group. Please try again.",
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
    if (group.name === "Private Group") console.log(group, requestedGroupsIds);

    return group;
  });

const filterGroups = (
  userId,
  criteria,
  groups,
  availableGroups,
  joinedGroupsIds
) => {
  return groups.filter((g) => {
    const canBeVisible =
      joinedGroupsIds && availableGroups
        ? g.creator !== userId &&
          !joinedGroupsIds.includes(g.id) &&
          g.showInSearch === true
        : true;

    const matchLevel =
      criteria.level?.length === 0 || criteria.level?.includes(g.level);

    const matchVisibility =
      criteria.visibility?.length === 0 ||
      criteria.visibility?.includes(g.visibility);

    let matchShowInSearch = true;

    if (availableGroups) matchShowInSearch = g.showInSearch; // Default to true if undefined

    let matchJoinable = true;

    if (criteria.joinableOnly) {
      matchJoinable = g.maxMembers > g.membersCount;
    }

    let matchRole = true;

    if (!availableGroups) {
      matchRole =
        criteria.role?.length === 0 ||
        (criteria.role?.includes("admin") && userId === g.creator) ||
        (criteria.role?.includes("member") &&
          joinedGroupsIds.includes(g.id) &&
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
  lastVisible = null
) => {
  try {
    let availableGroups = [];
    const userRef = db.collection("users").doc(userId);
    const requestedGroupsSnap = await userRef.collection("sentRequests").get();
    const requestedGroupsIds = requestedGroupsSnap.docs
      .filter((doc) => doc.data().status === "pending")
      .map((doc) => doc.id);
    const joinedGroupsSnap = await userRef.collection("userGroupsIds").get();
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
          remaining
        )
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
      requestedGroupsIds
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
  lastVisible = null
) => {
  try {
    let joinedGroups = [];

    const batchSize = Number(limit) * 10;

    const joinedGroupsSnap = await db
      .collection("users")
      .doc(userId)
      .collection("userGroupsIds")
      .get();
    const joinedGroupsIds = joinedGroupsSnap.empty
      ? []
      : joinedGroupsSnap.docs.map((doc) => doc.id);

    if (joinedGroupsIds.length === 0)
      return {
        cards: [],
        lastVisible: null,
      };

    do {
      let query = db
        .collection("groups")
        .where(FieldPath.documentId(), "in", joinedGroupsIds)
        .orderBy("creationDate", criteria.sort || "desc")
        .limit(batchSize);

      // Handle pagination
      if (lastVisible) {
        const lastVisibleDoc = await db
          .collection("groups")
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

      // Convert docs to objects
      const groups = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Add up to remaining needed groups
      const remaining = limit - joinedGroups.length;
      joinedGroups = joinedGroups.concat(
        filterGroups(userId, criteria, groups).slice(0, remaining)
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
      };

    if (!memberSnap.exists) {
      return {
        success: false,
        message: "User not found",
      };
    }

    await memberSnap.ref.delete();
    await groupRef.update({
      membersCount: FieldValue.increment(-1),
    });
    await userRef.collection("userGroupsIds").doc(groupId).delete();
    await refillSampleMembersIfNeeded(groupRef);

    return {
      success: true,
      message: "Left the group",
    };
  } catch (error) {
    console.log(error.message);
    return {
      success: false,
      message: "cant leave groupe , something went wrong",
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
      };
    }
  } catch (error) {
    console.error("Error in modifyGroup:", error.message);
    return {
      success: false,
      message: "Can't update group properties ! please try again later.",
    };
  }
};

const getAllGroups = async () => {
  try {
    const groupRef = db.collection("groups");
    const snapshot = await groupRef.get();
    const groups = [];
    if (snapshot.empty) {
      return false;
    } else {
      snapshot.forEach((doc) => {
        groups.push({ id: doc.id, ...doc.data() });
      });
      return groups;
    }
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const updateGroupProperty = async (groupId, propertie, newValue) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groups = await getAllGroups();
    const group = await groupRef.get();
    if (group.exists) {
      const isNotEmpty = newValue.trim() != "";

      switch (propertie) {
        case "name": {
          const isDuplicated = groups.some(
            (group) => group.id != groupId && group.nom_groupe === newValue
          );
          if (isDuplicated === false && isNotEmpty) {
            await groupRef.update({
              nom_groupe: newValue,
            });
            return {
              success: true,
              message: "Updated successfully",
            };
          }
          break;
        }
        case "description":
          if (isNotEmpty) {
            await groupRef.update({
              description: newValue,
            });
            return {
              success: true,
              message: "Updated successfully",
            };
          }
          break;
        case "creator":
          if (isNotEmpty) {
            await groupRef.update({
              creator: newValue,
            });
            return {
              success: true,
              message: "Updated successfully",
            };
          }
          break;
        case "subject":
          if (isNotEmpty) {
            await groupRef.update({
              matiere: newValue,
            });
            return {
              success: true,
              message: "Updated successfully",
            };
          }
          break;
        case "level":
          if (isNotEmpty) {
            await groupRef.update({
              niveau: newValue,
            });
            return {
              success: true,
              message: "Updated successfully",
            };
          }
          break;
        case "visibility":
          if (isNotEmpty) {
            await groupRef.update({
              visibility: newValue,
            });
            return {
              success: true,
              message: "Updated successfully",
            };
          }
          break;
        case "MaxMembres":
          if (newValue != null) {
            await groupRef.update({
              maxMembers: newValue,
            });
            return {
              success: true,
              message: "Updated successfully",
            };
          }
          break;
        case "showInSearch":
          if (isNotEmpty) {
            await groupRef.update({
              apparaitre_recherche: newValue,
            });
            return {
              success: true,
              message: "Updated successfully",
            };
          }
          break;
        default:
          return {
            success: false,
            message: "cant update",
          };
      }
    }
    return {
      success: false,
      message: "cant update",
    };
  } catch (error) {
    console.log(error.message);
    return {
      success: false,
      message: "cant update",
    };
  }
};

const deleteGroup = async (groupId) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupRes = await getGroupById(groupId);

    if (!groupRes.success) return groupRes;

    await groupRef.delete();
    return { success: true, message: "Group removed" };

  } catch (error) {
    console.log(error.message);
    return { success: false, message: "Group removed" };
  }
};

const getGroupInfo = async (groupId, userId) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();

    if (!groupSnap.exists)
      return { success: false, message: "Group not found" };
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
    };
  }
};

const getChatContext = async (userId, groupId) => {
  try {
    const groupRes = await getGroupById(groupId);

    if(!groupRes.success) return {
      ...groupRes,
      statusCode: 404
    };

    const group = groupRes.group;
    
    if (!group)
      return {
        success: false,
        statusCode: 404,
        message: "Group Not Found",
      };

    const userRef = db.collection("users").doc(userId);

    const isMember = await userRef
      .collection("userGroupsIds")
      .doc(groupId)
      .get();

    if (!isMember.exists)
      return {
        success: false,
        statusCode: 401,
        message: "You are not a member of this group",
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
    };
  }
};

const joinGroup = async (groupId, userData) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();

    if (!groupSnap.exists) {
      return {
        success: false,
        message: "Group does not exist",
      };
    }

    const group = groupSnap.data();

    if (group.visibility === "Public") {
      // Directly add member for public groups
      
      return await addMember(groupRef, userData.uid);
    }
    
    if (group.visibility === "Private" && group.showInSearch) {
      // Send join request for private groups that are discoverable
      return await sendRequest(groupId, userData);
    }

    return {
      success: false,
      message: "You cannot join this group.",
    };
  } catch (error) {
    console.error("Error in joinGroup:", error);
    return {
      success: false,
      message: "Internal server error",
    };
  }
};

const inviteMembers = async () => ({ success: true });

module.exports = {
  leaveGroup,
  getGroupInfo,
  joinGroup,
  createGroup,
  getAvailableGroups,
  getJoinedGroups,
  modifyGroup,
  getAllGroups,
  updateGroupProperty,
  deleteGroup,
  getChatContext,
  inviteMembers,
};
