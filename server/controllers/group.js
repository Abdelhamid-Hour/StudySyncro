const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../firebase/firebaseAdmin");

const createGroup = async (groupdData, userData) => {
  try {
    console.log(groupdData , "group data received")
    console.log(userData , "user data received ")
    const groupRef = db.collection("groups");
    const snapshot = await groupRef
      .where("name", "==", groupdData.groupName)
      .get();

    const newGrop = {
      groupName: groupdData.groupName,
      description: groupdData.description,
      subject: groupdData.subject,
      level: groupdData.level,
      maxMembers: groupdData.maxNum,
      visibility: groupdData.visibility,
      members: [
        {
          uid: userData.uid,
          name: userData.name,
          email: userData.email,
          photoURL: userData.picture || "here//goes//a//photo//url",
        },
      ],
      requests: [],
      membersUids : [userData.uid] ,
      creationDate: new Date(),
      creator: userData.uid,
      showInSearch: groupdData.showInSearch,
      currentSession : ""
    };

    if (snapshot.empty) {
      console.log("created")
      await groupRef.add(newGrop);
      return true;
    } else {
      console.log("not empty")
      return false;
    }
  } catch (error) {
    console.log("here the error")
    console.log(error.message);
    return false;
  }
}

const getAvailableGroups = async (user_id, limit, lastDoc = null, criteria, oldGroups = []) => {
  try {
    let availableGroups = [...oldGroups]; // Start with accumulated groups
    
    const groupRef = db.collection("groups");
    console.log(user_id, "here is the user id");
    
    let query = groupRef.orderBy("date_creation"); // Add ordering for consistent pagination
    
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }
    
    // Fetch a reasonable batch size
    const batchSize = Math.max(limit - availableGroups.length, 10); // At least 10 to make progress
    query = query.limit(batchSize);
    
    const snapshot = await query.get();
    
    // If no more documents, return what we have
    if (snapshot.empty) {
      console.log(availableGroups, "final available groups");
      return { groups: availableGroups, lastVisible: lastDoc };
    }
    
    // Filter out groups where user is creator or member
    let groups = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((group) => group.createur != user_id && !group.membres.includes(user_id));
    
    // Apply additional filter criteria
    const filteredGroups = await filterGroups(user_id, criteria, groups);
    
    // Add newly filtered groups to accumulated groups
    availableGroups = availableGroups.concat(filteredGroups);
    
    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    
    console.log(`Batch: ${filteredGroups.length} filtered, Total: ${availableGroups.length}/${limit}`);
    
    // If we have enough groups or no more documents available, return
    if (availableGroups.length >= limit || snapshot.docs.length < batchSize) {
      // Trim to requested limit
      const finalGroups = availableGroups.slice(0, limit);
      console.log(finalGroups, "final available groups");
      return { groups: finalGroups, lastVisible };
    }
    
    // Recursively fetch more groups
    return await getAvailableGroups(user_id, limit, lastVisible, criteria, availableGroups);
    
  } catch (error) {
    console.error(error.message, "error in getAvailableGroups");
    return { groups: oldGroups, lastVisible: lastDoc }; // Return what we have so far
  }
};

const getJoinedGroups = async (user_id, criteria, limit, lastDoc = null, oldGroups = []) => {
  try {
    let joinedGroups = [...oldGroups]; // Start with accumulated groups
    
    const groupRef = db.collection("groups");
    const allSnapshot = await groupRef.limit(5).get(); // Get first 5 groups
    
    if (!allSnapshot.empty) {
      allSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`📋 Group ${index + 1}:`, {
          id: doc.id,
          members: data.members,
          membres: data.membres, // Check both spellings
          membersType: typeof data.members,
          membresType: typeof data.membres,
          membersLength: data.members?.length,
          membresLength: data.membres?.length
        });
      });
    }


    let query = groupRef.where("membersUids", "array-contains", user_id);
    console.log(user_id , "this is the user id ")
 
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }
    
    const batchSize = Math.max(limit - joinedGroups.length, 10);
    query = query.limit(batchSize);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.log(joinedGroups, "final joined groups");
      return { groups: joinedGroups, lastVisible: lastDoc };
    }
    
    let groups = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log(groups , "these are the groups ")
    const filteredGroups = await filterGroups(user_id, criteria, groups);
    joinedGroups = joinedGroups.concat(filteredGroups);
    
    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    
    console.log(`Batch: ${filteredGroups.length} filtered, Total: ${joinedGroups.length}/${limit}`);
    
    if (joinedGroups.length >= limit || snapshot.docs.length < batchSize) {
      const finalGroups = joinedGroups.slice(0, limit);
      console.log(finalGroups, "final joined groups");
      return { groups: finalGroups, lastVisible };
    }
    
    return await getJoinedGroups(user_id, criteria, limit, lastVisible, joinedGroups);
    
  } catch (error) {
    console.log(error.message, "error in getJoinedGroups");
    return { groups: oldGroups, lastVisible: lastDoc };
  }
};

// Fixed filterGroups function with proper parameter
const filterGroups = async (user_id, criteria, groups) => {
  try {
    console.log("Filtering groups with criteria:", criteria);
    
    return groups.filter((g) => {
      const matchLevel =
        criteria.level.length === 0 ||
        criteria.level.includes(g.niveau?.toLowerCase());
      
      const matchVisibility =
        criteria.visibility.length === 0 ||
        criteria.visibility.includes(g.visibility?.toLowerCase());
      
      const matchShowInSearch = g.apparaitre_recherche !== false; // Default to true if undefined
      
      let matchJoinable = true;
      if (criteria.available) {
        matchJoinable = (g.nombre_max_membres || Infinity) > (g.membres?.length || 0);
      }
      
      const matchRole =
        criteria.role.length === 0 ||
        (criteria.role.includes("admin") && user_id === g.createur) ||
        (criteria.role.includes("membre") &&
          g.membres?.some(
            (membre) =>
              membre && membre.uid === user_id && user_id !== g.createur
          ));
      
      let matchSearch = true;
      const searchTerm = criteria.searchTerm?.trim().toLowerCase() || "";
      if (criteria.searchBy === "subject" && searchTerm) {
        matchSearch = g.matière?.toLowerCase().includes(searchTerm) || false;
      } else if (criteria.searchBy === "groupName" && searchTerm) {
        matchSearch = g.name?.toLowerCase().includes(searchTerm) || false;
      }
      
      const result = matchLevel && matchVisibility && matchShowInSearch && matchJoinable && matchSearch && matchRole;
      
      return result;
    });
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
    const user = group.membres.find((membre) => membre.uid === userId);
    if (group) {
      if (user) {
        groupRef.update({
          membres: FieldValue.arrayRemove(user),
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
        nombre_max_membres: formData.maxNum,
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


const getAllGroups = async ( ) => {
  try {
    const groupRef = db.collection("groups");
    const snapshot = await groupRef.get()
    const groups = []
    if (snapshot.empty) {
      return false;
    } else {
        snapshot.forEach((doc)=>{
          groups.push({id : doc.id , ...doc.data()})
        })
      return groups 
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
        case "nombre_membres":
          if (newValue != null) {
            await groupRef.update({
              nombre_max_membres: newValue,
            });
            return true;
          }
          break;
           case "apparaitre_recherche":
          if (isNotEmpty) {
            await groupRef.update({
              apparaitre_recherche :  newValue,
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
    console.log(error.message)
    return false 
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



module.exports = {
  createGroup,
  getAvailableGroups,
  getJoinedGroups,
  getGroupByID,
  modifyGroup,
  getAllGroups ,
  modifieGroupPropertie,
  deleteGroup,
};
