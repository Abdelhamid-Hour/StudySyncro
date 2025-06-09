const { FieldValue } = require("firebase-admin/firestore");
const { db, admin } = require("../../firebase/firebaseAdmin");
const createGroup = async (groupdData, userData) => {
  try {
    console.log(groupdData, "group data received");
    console.log(userData, "user data received ");
    const groupRef = db.collection("groups");
    const snapshot = await groupRef
      .where("name", "==", groupdData["group-name"])
      .get();
    console.log(snapshot, "this is the snapshot");

    const newGrop = {
      name: groupdData["group-name"],
      description: groupdData["group-description"],
      subject: groupdData.subject,
      level: groupdData.level,
      maxMembers: groupdData["max-members"],
      visibility: groupdData.visibility,
      members: [
        {
          uid: userData.uid,
          fullName: userData.fullName,
          email: userData.email,
          photoURL: userData.picture || "",
        },
      ],
      requests: [],
      membersUids: [userData.uid],
      creationDate: new Date().toISOString(),
      creator: userData.uid,
      showInSearch:
        groupdData.visibility === "Private" && !groupdData["show-in-search"]
          ? false
          : true,
      currentSession: "",
      quizzesList: [],
    };

    if (snapshot.empty) {
      console.log("created");
      await groupRef.add(newGrop);
      return {
        success: true,
      };
    } else {
      console.log("not empty");
      return {
        success: false,
        message:
          "A group with this name already exists. Please choose another name.",
      };
    }
  } catch (error) {
    console.log("here the error");
    console.log(error.message);
    return {
      success: false,
      message: "An error occurred while creating the group. Please try again.",
    };
  }
};

const getFormatedGroups = (groups, user_id) =>
  groups.map(({ members, creator, ...rest }) => ({
    ...rest,
    avatars: members.slice(0, 2).map(({ photoURL, fullName }) => ({
      photoURL,
      fullName,
    })),
    isHost: creator === user_id,
    extraMembersCount: members.length - 2,
  }));

const getAvailableGroups = async (
  user_id,
  criteria,
  limit,
  lastVisible = null,
  oldGroups = []
) => {
  try {
    let availableGroups = [...oldGroups]; // Start with accumulated groups

    // If we already have enough groups, return them
    if (availableGroups.length >= limit) {
      const finalGroups = getFormatedGroups(
        availableGroups.slice(0, limit),
        user_id
      );
      return { cards: finalGroups, lastVisible };
    }

    let query = db.collection("groups");

    // Handle pagination
    if (typeof lastVisible === "string" && lastVisible.trim() !== "") {
      const doc = db.collection("groups").doc(lastVisible);
      const lastElement = await doc.get();
      query = query.startAfter(lastElement);
    } else if (lastVisible) {
      query = query.startAfter(lastVisible);
    }

    // Calculate batch size - fetch more than needed to account for filtering
    const need = limit - availableGroups.length;
    const batchSize = Math.max(need * 2, 20); // Fetch more to account for filtering
    query = query.limit(batchSize);

    const snapshot = await query.get();
    console.log(snapshot.size, "size");

    // If no documents at all (first call), return empty
    if (snapshot.empty && availableGroups.length === 0) {
      return { cards: [], lastVisible: null };
    }

    // If no more documents, return what we have and set lastVisible to null
    if (snapshot.empty) {
      const finalGroups = getFormatedGroups(availableGroups, user_id);
      return { cards: finalGroups, lastVisible: null };
    }

    // Convert documents to objects
    let groups = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (group) =>
          group.creator != user_id &&
          !group.membersUids.includes(user_id) &&
          group.showInSearch === true
      );
    // Apply filter criteria if provided
    const filteredGroups = criteria
      ? await filterGroups(user_id, criteria, groups, true)
      : groups;

    // Add newly filtered groups to accumulated groups
    availableGroups = availableGroups.concat(filteredGroups);

    // Update lastVisible for next pagination
    const newLastVisible = snapshot.docs[snapshot.docs.length - 1];

    // Check if we have enough groups or if this was the last batch
    const isLastBatch = snapshot.docs.length < batchSize;
    const hasEnoughGroups = availableGroups.length >= limit;

    if (hasEnoughGroups || isLastBatch) {
      // Trim to requested limit if we have more than needed
      const groupsToReturn = availableGroups.slice(0, limit);
      const finalGroups = getFormatedGroups(groupsToReturn, user_id);

      // Set lastVisible to null if this is the last batch OR if we have exactly what we need
      const finalLastVisible =
        isLastBatch || availableGroups.length <= limit
          ? null
          : newLastVisible.id;

      return { cards: finalGroups, lastVisible: finalLastVisible };
    }

    // Recursively fetch more groups
    return await getJoinedGroups(
      user_id,
      criteria,
      limit,
      newLastVisible.id,
      joinedGroups
    );
  } catch (error) {
    console.error(error.message, "error in getJoinedGroups");
    return { cards: getFormatedGroups(oldGroups, user_id), lastVisible }; // Return what we have so far
  }
};

const getJoinedGroups = async (
  user_id,
  criteria,
  limit,
  lastVisible = null,
  oldGroups = []
) => {
  try {
    let joinedGroups = [...oldGroups]; // Start with accumulated groups

    // If we already have enough groups, return them
    if (joinedGroups.length >= limit) {
      const finalGroups = getFormatedGroups(
        joinedGroups.slice(0, limit),
        user_id
      );
      return { cards: finalGroups, lastVisible };
    }

    const groupRef = db.collection("groups");
    let query = groupRef.where("membersUids", "array-contains", user_id);

    // Handle pagination
    if (typeof lastVisible === "string" && lastVisible.trim() !== "") {
      const doc = db.collection("groups").doc(lastVisible);
      const lastElement = await doc.get();
      query = query.startAfter(lastElement);
    } else if (lastVisible) {
      query = query.startAfter(lastVisible);
    }

    // Calculate batch size - fetch more than needed to account for filtering
    const need = limit - joinedGroups.length;
    const batchSize = Math.max(need * 2, 20); // Fetch more to account for filtering
    query = query.limit(batchSize);

    const snapshot = await query.get();
    console.log(snapshot.size, "size");

    // If no documents at all (first call), return empty
    if (snapshot.empty && joinedGroups.length === 0) {
      return { cards: [], lastVisible: null };
    }

    // If no more documents, return what we have and set lastVisible to null
    if (snapshot.empty) {
      const finalGroups = getFormatedGroups(joinedGroups, user_id);
      return { cards: finalGroups, lastVisible: null };
    }

    // Convert documents to objects
    let groups = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Apply filter criteria if provided
    const filteredGroups = criteria
      ? await filterGroups(user_id, criteria, groups)
      : groups;

    // Add newly filtered groups to accumulated groups
    joinedGroups = joinedGroups.concat(filteredGroups);

    // Update lastVisible for next pagination
    const newLastVisible = snapshot.docs[snapshot.docs.length - 1];

    // Check if we have enough groups or if this was the last batch
    const isLastBatch = snapshot.docs.length < batchSize;
    const hasEnoughGroups = joinedGroups.length >= limit;

    if (hasEnoughGroups || isLastBatch) {
      // Trim to requested limit if we have more than needed
      const groupsToReturn = joinedGroups.slice(0, limit);
      const finalGroups = getFormatedGroups(groupsToReturn, user_id);

      // Set lastVisible to null if this is the last batch OR if we have exactly what we need
      const finalLastVisible =
        isLastBatch || joinedGroups.length <= limit ? null : newLastVisible.id;

      return { cards: finalGroups, lastVisible: finalLastVisible };
    }

    // Recursively fetch more groups
    return await getJoinedGroups(
      user_id,
      criteria,
      limit,
      newLastVisible.id,
      joinedGroups
    );
  } catch (error) {
    console.error(error.message, "error in getJoinedGroups");
    return { cards: getFormatedGroups(oldGroups, user_id), lastVisible }; // Return what we have so far
  }
};

const filterGroups = async (user_id, criteria, groups, availableGroups) => {
  try {
    console.log("filter", criteria);

    const filteredGroups = groups.filter((g) => {
      const matchLevel =
        criteria.level?.length === 0 || criteria.level?.includes(g.level);

      const matchVisibility =
        criteria.visibility?.length === 0 ||
        criteria.visibility?.includes(g.visibility);

      let matchShowInSearch = true;

      if (availableGroups) matchShowInSearch = g.showInSearch; // Default to true if undefined

      let matchJoinable = true;
      if (criteria.joinableOnly) {
        matchJoinable = (g.maxMembers || Infinity) > (g.members?.length || 0);
      }

      let matchRole = true;

      if (!availableGroups) {
        matchRole =
          criteria.role?.length === 0 ||
          (criteria.role?.includes("admin") && user_id === g.creator) ||
          (criteria.role?.includes("member") &&
            g.membersUids.includes(user_id) &&
            user_id != g.creator);
      }

      let matchSearch = true;
      const searchTerm = criteria.searchTerm?.trim().toLowerCase() || "";

      if (searchTerm) {
        matchSearch =
          g.subject?.toLowerCase().includes(searchTerm) ||
          g.name?.toLowerCase().includes(searchTerm);
      }

      const result =
        matchLevel &&
        matchVisibility &&
        matchShowInSearch &&
        matchJoinable &&
        matchSearch &&
        matchRole;

      console.log(
        "matchLevel:",
        matchLevel,
        "matchVisibility:",
        matchVisibility,
        "matchShowInSearch:",
        matchShowInSearch,
        "matchJoinable:",
        matchJoinable,
        "matchSearch:",
        matchSearch,
        "matchRole:",
        matchRole
      );

      return result;
    });

    // Sort by creationDate based on criteria
    let sortedGroups = filteredGroups;

    if (criteria.sort === "desc" && filteredGroups.length >= 2) {
      sortedGroups = filteredGroups.sort((a, b) => {
        const dateA = new Date(a.creationDate);
        const dateB = new Date(b.creationDate);
        return dateB - dateA; // Descending order (newest first)
      });
    } else if (criteria.sort === "asc" && filteredGroups.length >= 2) {
      sortedGroups = filteredGroups.sort((a, b) => {
        const dateA = new Date(a.creationDate);
        const dateB = new Date(b.creationDate);
        return dateA - dateB; // Ascending order (oldest first)
      });
    }
    console.log(sortedGroups.length);
    return sortedGroups;
  } catch (error) {
    console.log(error.message, "error in filterGroups");
    return [];
  }
};

const getGroupByID = async (groupId) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const snaphsot = await groupRef.get();
    if (snaphsot.empty) {
      return false;
    } else {
      const group = { id: groupId, ...snaphsot.data() };
      return group;
    }
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const quitterGroup = async (groupId, userId) => {
  try {
    const group = await getGroupByID(groupId);
    const groupRef = db.collection("groups").doc(groupId);
    const user = group.members.find((membre) => membre.uid === userId);
    if (group) {
      if (user) {
        groupRef.update({
          members: FieldValue.arrayRemove(user),
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

const modifyGroup = async (groupId, formData) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groups = await getAllGroups();
    console.log(groups, "these are the groups ");
    const isDuplicated = groups.some(
      (group) => group.uid != groupId && group.nom_groupe === formData.nomGroupe
    );
    const group = await getGroupByID(groupId);
    console.log(groupId, "group id");
    console.log(formData, "form data");
    console.log(group, "group");
    if (group && !isDuplicated) {
      await groupRef.update({
        nom_groupe: formData.nomGroupe,
        description: formData.description,
        matière: formData.matiere,
        niveau: formData.niveau,
        maxMembers: formData.maxNum,
        visibility: formData.visibility,
        appataire_recherche: formData.apparaitreRecherche,
      });
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error.message);
    return false;
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

const modifieGroupPropertie = async (groupId, propertie, newValue) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groups = await getAllGroups();
    const group = await groupRef.get();
    if (group.exists) {
      const isNotEmpty = newValue.trim() != "";

      switch (propertie) {
        case "nom_groupe": {
          const isDuplicated = groups.some(
            (group) => group.id != groupId && group.nom_groupe === newValue
          );
          if (isDuplicated === false && isNotEmpty) {
            await groupRef.update({
              nom_groupe: newValue,
            });
            return true;
          }
          break;
        }
        case "description":
          if (isNotEmpty) {
            await groupRef.update({
              description: newValue,
            });
            return true;
          }
          break;
        case "matiere":
          if (isNotEmpty) {
            await groupRef.update({
              matiere: newValue,
            });
            return true;
          }
          break;
        case "niveau":
          if (isNotEmpty) {
            await groupRef.update({
              niveau: newValue,
            });
            return true;
          }
          break;
        case "visibility":
          if (isNotEmpty) {
            await groupRef.update({
              visibility: newValue,
            });
            return true;
          }
          break;
        case "nombre_members":
          if (newValue != null) {
            await groupRef.update({
              maxMembers: newValue,
            });
            return true;
          }
          break;
        case "apparaitre_recherche":
          if (isNotEmpty) {
            await groupRef.update({
              apparaitre_recherche: newValue,
            });
            return true;
          }
          break;
        default:
          return false;
      }
    }
    return false;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const deleteGroup = async (groupId) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const group = await getGroupByID(groupId);
    if (group) {
      await groupRef.delete();
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const getFormattedMembers = (members) =>
  members.map(({ photoURL, fullName }) => ({
    photoURL,
    fullName,
  }));

const getGroupInfo = async (id, userId) => {
  try {
    const group = await getGroupByID(id);
    if (!group) return { success: false, message: "Group not found" };
    const adminInfo = group.members.find((m) => m.uid === group.creator);
    console.log(adminInfo, "info");
    console.log(group, "this is the group");

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
        creationDate: group.creationDate.split("T")[0],
        Admin: {
          fullName: adminInfo.fullName,
          photoURL: adminInfo.photoURL,
        },
        members: getFormattedMembers(group.members),
        isAdmin: group.creator === userId,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "An error occurred while fetching group info. Please try again.",
    };
  }
};

module.exports = {
  getGroupInfo,
  createGroup,
  getAvailableGroups,
  getJoinedGroups,
  getGroupByID,
  modifyGroup,
  getAllGroups,
  modifieGroupPropertie,
  deleteGroup,
};
