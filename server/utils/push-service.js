const webpush = require("web-push");
const { db } = require("../firebase/firebaseAdmin");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:noreply.studyhype@gmail.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

/**
 * Sends a push notification to all active devices of a user.
 * @param {string} uid The user's ID
 * @param {object} payload The notification data
 */
const sendPushNotification = async (uid, payload) => {
  try {
    const subscriptionsSnapshot = await db
      .collection("users")
      .doc(uid)
      .collection("pushSubscriptions")
      .get();

    if (subscriptionsSnapshot.empty) {
      return; // No active subscriptions for this user
    }

    const promises = [];
    subscriptionsSnapshot.forEach((doc) => {
      console.log("doc sub : ", doc);

      const subscription = doc.data();

      const customPayload = { ...payload, lang: subscription.lang || "en" };
      const payloadString = JSON.stringify(customPayload);
      // Remove any internal Firestore fields if they were accidentally saved alongside the subscription object
      const subToPush = {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        expirationTime: subscription.expirationTime || null,
      };

      const p = webpush
        .sendNotification(subToPush, payloadString)
        .catch((error) => {
          if (error.statusCode === 404 || error.statusCode === 410) {
            console.log(
              "Subscription has expired or is no longer valid. Deleting from DB...",
            );
            return doc.ref.delete();
          } else {
            console.error("Error sending push notification to device:", error);
          }
        });
      promises.push(p);
    });

    await Promise.all(promises);
  } catch (error) {
    console.error("Error in sendPushNotification:", error);
  }
};

module.exports = { sendPushNotification };
