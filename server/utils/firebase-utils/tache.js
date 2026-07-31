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

const changeTaskStatus = async (status, taskId) => {
  try {
    const ref = db.collection("tasks").doc(taskId);

    const txResult = await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      if (snap.exists) {
        t.update(ref, { status });
        return { abort: false };
      }
      return { abort: true };
    });

    if (!txResult.abort) {
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
  getTasks,
};
