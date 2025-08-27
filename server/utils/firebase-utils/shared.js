const { db } = require("../../firebase/firebaseAdmin");

const getGroupById = async (groupId) => {
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

module.exports = {
  getGroupById,
};
