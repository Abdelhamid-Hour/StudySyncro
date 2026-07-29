const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../../firebase/firebaseAdmin");
const tacheRef = db.collection("tache");

const getTasks = async (sessionId) => {
  const taskRef = db.collection("tasks");

  const tasksSnap = await taskRef
    .where("sessionId", "==", sessionId)
    .orderBy("index", "asc")
    .get();

  return tasksSnap.docs.map((doc) => ({
    UID: doc.id,
    ...doc.data(),
  }));
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

const changeTaskStatus = async (status, taskId) => {
  try {
    const ref = db.collection("tasks").doc(taskId);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.update({
        status,
      });
      return {
        success: true,
        message: "api:task_status_updated",
      };
    }
    return {
      success: false,
      message: "api:task_not_found",
      isNative: true,
      type: "info",
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "api:could_not_update_task_status",
      isNative: false,
      type: "error",
    };
  }
};

module.exports = {
  changeTaskStatus,
  deleteTache,
  getTasks,
  modifieTache,
};
