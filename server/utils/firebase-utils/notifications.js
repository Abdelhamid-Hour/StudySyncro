const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../../firebase/firebaseAdmin");

const addNotification = (userId, notification) => {
  try {
    const notificationRef = db
      .collection("notifications")
      .doc(userId)
      .collection("notifications");
    notificationRef.add({
      ...notification,
      timestamp: FieldValue.serverTimestamp(),
      read: false,
    });
  } catch (error) {
    console.error(error);
    throw new Error("Failed to add notification");
  }
};

module.exports = {
  addNotification,
};
