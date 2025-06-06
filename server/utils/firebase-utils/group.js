const { FieldValue } = require('firebase-admin/firestore');
const { db } = require('../../firebase/firebaseAdmin');

const createGroup = async (groupdData, userData) => {
  try {
    console.log(groupdData, 'group data received');
    console.log(userData, 'user data received ');
    const groupRef = db.collection('groups');
    const snapshot = await groupRef
      .where('name', '==', groupdData['group-name'])
      .get();
    console.log(snapshot, 'this is the snapshot');

    const newGrop = {
      name: groupdData['group-name'],
      description: groupdData['group-description'],
      subject: groupdData.subject,
      level: groupdData.level,
      maxMembers: groupdData['max-members'],
      visibility: groupdData.visibility,
      members: [
        {
          uid: userData.uid,
          fullName: userData.fullName,
          email: userData.email,
          photoURL: userData.picture || '',
        },
      ],
      requests: [],
      membersUids: [userData.uid],
      creationDate: new Date().toISOString(),
      creator: userData.uid,
      showInSearch: groupdData['show-in-search'] || true,
      currentSession: '',
      quizzesList: [],
    };

    if (snapshot.empty) {
      console.log('created');
      await groupRef.add(newGrop);
      return {
        success: true,
      };
    } else {
      console.log('not empty');
      return {
        success: false,
        message:
          'A group with this name already exists. Please choose another name.',
      };
    }
  } catch (error) {
    console.log('here the error');
    console.log(error.message);
    return {
      success: false,
      message: 'An error occurred while creating the group. Please try again.',
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

    const groupRef = db.collection('groups');

    let query = groupRef.orderBy('creationDate'); // Add ordering for consistent pagination

    if (lastVisible) {
      query = query.startAfter(lastVisible);
    }

    // Fetch a reasonable batch size
    const batchSize = Math.max(limit - availableGroups.length, 10); // At least 10 to make progress
    query = query.limit(batchSize);

    const snapshot = await query.get();

    // If no more documents, return what we have
    if (snapshot.empty) {
      return {
        cards: getFormatedGroups(availableGroups, user_id),
        lastVisible: null,
      };
    }

    // Filter out groups where user is creator or member
    let groups = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (group) => group.creator != user_id && !group.members.includes(user_id)
      );
    // Apply additional filter criteria
    const filteredGroups = await filterGroups(user_id, criteria, groups);

    // Add newly filtered groups to accumulated groups
    availableGroups = availableGroups.concat(filteredGroups);

    lastVisible = snapshot.docs[snapshot.docs.length - 1].id;

    // If we have enough groups or no more documents available, return
    if (availableGroups.length >= limit || snapshot.docs.length < batchSize) {
      // Trim to requested limit
      const finalGroups = availableGroups.slice(0, limit);
      return {
        cards: getFormatedGroups(finalGroups, user_id),
        lastVisible,
      };
    }

    // Recursively fetch more groups
    return await getAvailableGroups(
      user_id,
      criteria,
      limit,
      lastVisible,
      availableGroups
    );
  } catch (error) {
    console.error(error.message, 'error in getAvailableGroups');
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

    const groupRef = db.collection('groups');

    let query = groupRef.where('membersUids', 'array-contains', user_id);
    // console.log(user_id, "this is the user id ");
    console.log('await query.get():', (await query.get()).size);

    if (lastVisible) {
      const ref = groupRef.doc(lastVisible);
      const group = await ref.get();
      console.log('last group', group);
      query = query.startAfter(group);
    }

    const batchSize = Math.max(limit - joinedGroups.length, 10);
    query = query.limit(batchSize);

    const snapshot = await query.get();

    if (snapshot.empty) {
      // console.log(joinedGroups, "final joined groups");

      return { cards: joinedGroups, lastVisible: null };
    }

    let groups = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    //console.log(groups, "these are the groups ");
    const filteredGroups = groups;
    joinedGroups = joinedGroups.concat(filteredGroups);

    lastVisible = snapshot.docs[snapshot.docs.length - 1].id;

    if (joinedGroups.length >= limit || snapshot.docs.length < batchSize) {
      const cards = joinedGroups
        .slice(0, limit)
        .map(({ members, creator, ...rest }) => ({
          ...rest,
          avatars: members.slice(0, 2).map(({ photoURL, fullName }) => ({
            photoURL,
            fullName,
          })),
          isHost: creator === user_id,
          extraMembersCount: members.length - 2,
        }));
      console.log(cards, 'last cards');
      return { cards, lastVisible };
    }

    return await getJoinedGroups(
      user_id,
      criteria,
      limit,
      lastVisible,
      joinedGroups
    );
  } catch (error) {
    console.log(error.message, 'error in getJoinedGroups');
    return { cards: oldGroups, lastVisible };
  }
};

// Fixed filterGroups function with proper parameter
const filterGroups = async (user_id, criteria, groups) => {
  try {
    console.log('Filtering groups with criteria:', criteria);

    return groups.filter((g) => {
      const matchLevel =
        criteria.level.length === 0 ||
        criteria.level.includes(g.level?.toLowerCase());

      const matchVisibility =
        criteria.visibility.length === 0 ||
        criteria.visibility.includes(g.visibility?.toLowerCase());

      const matchShowInSearch = g.showInSearch !== false; // Default to true if undefined

      let matchJoinable = true;
      if (criteria.joinableOnly) {
        matchJoinable = (g.maxMembers || Infinity) > (g.members?.length || 0);
      }

      const matchRole =
        criteria.role.length === 0 ||
        (criteria.role.includes('admin') && user_id === g.createur) ||
        (criteria.role.includes('member') &&
          g.members?.some(
            (membre) =>
              membre && membre.uid === user_id && user_id !== g.createur
          ));

      let matchSearch = true;
      const searchTerm = criteria.searchTerm?.trim().toLowerCase();

      matchSearch =
        g.subject?.toLowerCase().includes(searchTerm) ||
        g.name?.toLowerCase().includes(searchTerm) ||
        searchTerm == '';

      const result =
        matchLevel &&
        matchVisibility &&
        matchShowInSearch &&
        matchJoinable &&
        matchSearch &&
        matchRole;

      return result;
    });
  } catch (error) {
    console.log(error.message, 'error in filterGroups');
    return [];
  }
};

const getGroupByID = async (groupId) => {
  try {
    const groupRef = db.collection('groups').doc(groupId);
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
    const groupRef = db.collection('groups').doc(groupId);
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
    const groupRef = db.collection('groups').doc(groupId);
    const groups = await getAllGroups();
    console.log(groups, 'these are the groups ');
    const isDuplicated = groups.some(
      (group) => group.uid != groupId && group.nom_groupe === formData.nomGroupe
    );
    const group = await getGroupByID(groupId);
    console.log(groupId, 'group id');
    console.log(formData, 'form data');
    console.log(group, 'group');
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
    const groupRef = db.collection('groups');
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
    const groupRef = db.collection('groups').doc(groupId);
    const groups = await getAllGroups();
    const group = await groupRef.get();
    if (group.exists) {
      const isNotEmpty = newValue.trim() != '';

      switch (propertie) {
        case 'nom_groupe': {
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
        case 'description':
          if (isNotEmpty) {
            await groupRef.update({
              description: newValue,
            });
            return true;
          }
          break;
        case 'matiere':
          if (isNotEmpty) {
            await groupRef.update({
              matiere: newValue,
            });
            return true;
          }
          break;
        case 'niveau':
          if (isNotEmpty) {
            await groupRef.update({
              niveau: newValue,
            });
            return true;
          }
          break;
        case 'visibility':
          if (isNotEmpty) {
            await groupRef.update({
              visibility: newValue,
            });
            return true;
          }
          break;
        case 'nombre_members':
          if (newValue != null) {
            await groupRef.update({
              maxMembers: newValue,
            });
            return true;
          }
          break;
        case 'apparaitre_recherche':
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
    const groupRef = db.collection('groups').doc(groupId);
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

module.exports = {
  createGroup,
  getAvailableGroups,
  getJoinedGroups,
  getGroupByID,
  modifyGroup,
  getAllGroups,
  modifieGroupPropertie,
  deleteGroup,
};
