const { FieldValue } = require('firebase-admin/firestore');
const { db } = require('../../firebase/firebaseAdmin');
const { getGroupByID } = require('./group');
const { messaging } = require('firebase-admin');

const ajouterMembre = async (groupId, userId) => {
  try {
    const groupRef = db.collection('groups').doc(groupId);
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const groupSnap = await groupRef.get();
    // Check if group exists, user exists, and user is not already a member
    if (!groupSnap.exists) {
      return { message: 'Group  does not exist', success: false };
    } else if (!userSnap.exists) {
      return { message: 'User does not exist', success: false };
    }
    const group = groupSnap.data();
    // Ensure members is always an array
    const maxMembre = group.members.length >= group.maxMembers;
    if (maxMembre) {
      return { message: 'Group is full', success: false };
    }
    const userData = userSnap.data();

    const isAlreadyMember = group.members.some(
      (membre) => membre.uid === userId
    );

    if (isAlreadyMember) {
      return { message: 'You are already a member', success: false };
    }

    // Add user to group members
    await groupRef.update({
      members: FieldValue.arrayUnion({
        uid: userId,
        fullName: userData.fullName || userData.displayName || 'Utilisateur',
        email: userData.email || '',
        photoURL:
          userData.picture || userData.photoURL || 'here//goes//a//photo//url',
      }),
      membersUids: FieldValue.arrayUnion(userId),
    });

    console.log('Member added successfully');
    return {
      message: 'Joined the group successfully',
      status: 'joined',
      success: true,
    };
  } catch (error) {
    console.error('Error in ajouterMembre function:', error);
    return { message: 'Internal sever error', success: false };
  }
};

const sendRequest = async (groupId, userData) => {
  try {
    const groupRef = db.collection('groups').doc(groupId);
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
        return { message: 'You have already sent a request', success: false };
      } else if (group.members.some((member) => member.uid === userData.uid)) {
        return {
          message: 'You are already a member ',
          success: false,
        };
      } else if (data.showInSearch) {
        await groupRef.update({
          requests: FieldValue.arrayUnion({
            uid: userData.uid,
            name: userData.fullName,
            email: userData.email,
            photoURL: userData.picture || 'here//goes//a//photo//url',
            sentAt: new Date().toISOString(),
          }),
        });
        return {
          message: "Can't send request the group is full",
          status: 'requested',
          success: true,
        };
      } else {
      }
    } else {
      return {
        message: 'Group does not exists',
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
    const ref = db.collection('groups').doc(groupId);
    const snaphsot = await ref.get();

    if (snaphsot.exists) {
      const group = snaphsot.data();

      if (group.visibility === 'Public') {
        return (result = await ajouterMembre(groupId, userData.uid));
      } else if (group.showInSearch && group.visibility === 'Private') {
        return (result = await sendRequest(groupId, userData));
      }
    } else {
      return {
        message: 'Group does not exist',
        success: false,
      };
    }
  } catch (error) {
    console.error(error);
    return { message: 'Internal server error', success: false };
  }
};
const acceptRequest = async (groupId, requestId, userId) => {
  try {
    const groupRef = db.collection('groups').doc(groupId);

    const result = await db.runTransaction(async (transaction) => {
      const groupDocSnapshot = await transaction.get(groupRef);

      if (!groupDocSnapshot.exists) {
        return { success: false, message: `Group with ID ${groupId} not found.` };
      }

      const groupData = groupDocSnapshot.data();

      if (groupData.creator !== userId) {
        return { success: false, message: "Only the group creator can accept requests." };
      }

      const requestToAccept = groupData.requests.find((demande) => demande.uid === requestId);

      if (!requestToAccept) {
        return { success: false, message: "Join request not found." };
      }

      const newMember = {
        uid: requestToAccept.uid,
        fullName: requestToAccept.name,
        email: requestToAccept.email,
        photoURL: requestToAccept.photoURL,
      };
      
      const isAlreadyMember = groupData.members.some(member => member.uid === newMember.uid);

      if (isAlreadyMember) {
        transaction.update(groupRef, {
            requests: FieldValue.arrayRemove(requestToAccept),
        });
        return { success: true, message: "User is already a member, request removed." };
      }

      transaction.update(groupRef, {
        members: FieldValue.arrayUnion(newMember),
        requests: FieldValue.arrayRemove(requestToAccept),
      });

      return { success: true, message: 'Join request accepted successfully!' };
    });

    return result;

  } catch (error) {
    console.error("Error accepting request:", error.message);
    return {
      success: false,
      message: `Failed to accept request: ${error.message || "An unexpected error occurred."}`
    };
  }
};
const rejectRequest = async (groupId, requestId , userId ) => {
  try {
    const groupRef = db.collection('groups').doc(groupId);
    const group = await getGroupByID(groupId);
    if (group && group.creator === userId) {
      const request = group.requests.find(
        (demande) => demande.uid === requestId
      );
      if (request) {
        await groupRef.update({
          requests: FieldValue.arrayRemove(request),
        });
        return {
          success : true , 
          message : "Request rejected successfully."
        }
      } else {
        return {
           success  : false , 
           message : "No Request match "
        }
      }
    } else {
      return {
        success : false , 
        message : "No group found or user does not have the right to accomplish the action"
      };
    }
  } catch (error) {
    console.log(error.message);
    return {
      success : false , 
      message : "Something wrong happened "
    }
  }
};

const getFormattedMembers = (members) => {
  return members.map(({ photoURL, fullName, uid }) => ({
    photoURL,
    fullName,
    id: uid,
  }));
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
    const group = await getGroupByID(groupId);
    if (!group) return { success: false, message: 'Group not found' };
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
      message: 'An error occurred while fetching requests',
    };
  }
};

const getMembers = async (groupId, userId) => {
  try {
    const group = await getGroupByID(groupId);
   

    if (!group) return { success: false, message: 'Group not found' };
    const kamo =
      group.creator === userId
        ? group.members.filter((m) => m.uid != group.creator)
        : group.members;
    const members = getFormattedMembers(kamo);
    return {
      success: true,
      context: {
        isAdmin: group.creator === userId,
        count: members.length,
        members,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: 'An error occurred while fetching members',
    };
  }
};

const kickMember = async (groupId, userId) => {
  try {
    const group = await getGroupByID(groupId);
    const groupRef = db.collection('groups').doc(groupId);
    const user = group.members.find((membre) => membre.uid === userId);
    if (group && user) {
      await groupRef.update({
        members: FieldValue.arrayRemove(user),
      });
      return  {
    success: true,
    message: 'Member kicked from group',
  };
    }
    return    {
    success: false ,
    message: 'user not found',
  };;
  } catch (error) {
    console.log(error.message);
     return  {
    success: false ,
    message: 'Something went wrong',
  };
  }
};

module.exports = {
  getFormattedMembers,
  getRequests,
  kickMember,
  acceptRequest,
  rejectRequest,
  joinGroup,
  ajouterMembre ,
  getMembers,
};
