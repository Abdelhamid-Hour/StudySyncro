const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../../firebase/firebaseAdmin");
const tacheRef = db.collection("tache");

const createTach = async (tacheData) => {
  try {
    if (tacheData) {
      await tacheRef.add(tacheData);
      return true;
    }
    return false;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const modifieTache = async (propertie, newValue, tacheId) => {
  try {
    const ref = tacheRef.doc(tacheId);
    const snaphsot = await ref.get();
    const tache = snaphsot.data();
    const isEmpty = newValue.trim() == "";
    if (tache) {
      if (!isEmpty) {
        switch (propertie) {
          case "title":
            await ref.update({
              title: newValue,
            });
            return true;
          case "description":
            await ref.update({
              description: newValue,
            });
            return true;
          case "duration":
            await ref.update({
              duration: newValue,
            });
            return true;
          case "state":
            await ref.update({
              state: newValue,
            });
            return true;
          default:
            return false;
        }
      }
    } else {
      return false;
    }
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const deleteTache = async (tacheId) => {
  try {
    const ref = tacheRef.doc(tacheId);
    const snaphsot = await ref.get();
    const tache = snaphsot.data();
    if (tache) {
      await ref.delete();
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const getTaches = async (sessionId) => {
  try {
    const taches = [];
    const snaphsot = await tacheRef.where("sessionId", "==", sessionId).get();
    if (snaphsot.empty) {
      return 0;
    } else {
      snaphsot.forEach((doc) => {
        taches.push({ id: doc.id, ...doc.data() });
      });
      return taches;
    }
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const changeTaskState = async (state, taskId) => {
  try {
    const ref = db.collection("tasks").doc(taskId);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.update({
        state: state,
      });
      return {
        success: true,
        message: `Task ${taskId} status updated to ${state}`,
      };
    }
    return{
        success : true , 
        message : "uprdtyauediksdg"
    }
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Could not update task state",
    };
  }
};

module.exports = {
  changeTaskState,
  getTaches,
  deleteTache,
  createTach,
  modifieTache,
};
