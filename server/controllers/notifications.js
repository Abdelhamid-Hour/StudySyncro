const { db } = require("../firebase/firebaseAdmin");
const {
  resolveTimestamp,
  getUserNotifications,
  markLoadedNotificationsAsRead,
} = require("../utils/firebase-utils/notifications");
const { INITIALE_LOADERS_COUNT } = require("../utils/global");

const NOTIF_STREAM_MAP = new Map();

const getUserNotificationsHandler = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { lastVisible = null, count = INITIALE_LOADERS_COUNT } = req.query;

    const result = await getUserNotifications(userId, count, lastVisible, req.query);
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json({
        message: res.locals.t(result.message) || "Failed to fetch notifications",
        isNative: result.isNative ?? false,
        type: result.type ?? "error",
      });
    }
  } catch (error) {
    console.error("Error in getUserNotificationsHandler:", error);
    return res.status(500).json({ message: res.locals.t("api:internal_server_error_1"), isNative: false, type: "error" });
  }
};

const markNotificationsAsReadHandler = async (req, res) => {
  try {
    const userId = req.user.uid;
    const result = await markLoadedNotificationsAsRead(userId);
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json({
        message: res.locals.t(result.message) || "Failed to mark notifications as read",
        isNative: result.isNative ?? false,
        type: result.type ?? "error",
      });
    }
  } catch (error) {
    console.error("Error in markNotificationsAsReadHandler:", error);
    return res.status(500).json({ message: res.locals.t("api:internal_server_error_1"), isNative: false, type: "error" });
  }
};

const streamNotificationsHandler = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders && res.flushHeaders();

  const userId = req.user.uid;

  if (NOTIF_STREAM_MAP.has(userId)) {
    try {
      NOTIF_STREAM_MAP.get(userId).unSubscribe();
      NOTIF_STREAM_MAP.get(userId).res.end();
    } catch (e) {}
    NOTIF_STREAM_MAP.delete(userId);
  }

  const query = db.collection("notifications").doc(userId).collection("notifications");
  let isInitialSnapshot = true;

  const unSubscribe = query.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      
      if (change.type === "added" || change.type === "modified") {
        if (isInitialSnapshot) return;
        const data = change.doc.data();
        const notif = {
          id: change.doc.id,
          changeType: change.type,
          ...data,
          timestamp: resolveTimestamp(data.timestamp),
        };
        try {
          res.write(`data: ${JSON.stringify(notif)}\n\n`);
        } catch (e) {}
      }
    });
    isInitialSnapshot = false;
  }, (error) => {
    console.error("Error in notifications stream:", error);
    try { res.end(); } catch (e) {}
  });

  NOTIF_STREAM_MAP.set(userId, { res, unSubscribe });

  const heartbeat = setInterval(() => {
    try {
      res.write(":\n\n");
    } catch (e) {
      clearInterval(heartbeat);
      unSubscribe();
      try { res.end(); } catch (err) {}
      NOTIF_STREAM_MAP.delete(userId);
    }
  }, 20 * 1000);

  req.on("close", () => {
    try {
      clearInterval(heartbeat);
      unSubscribe();
      res.end();
      NOTIF_STREAM_MAP.delete(userId);
    } catch (error) {
      console.warn("Error closing notifications stream:", error);
    }
  });
};

const subscribePushHandler = async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user.uid;
    const lang = req.cookies.lang || "en";

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Invalid subscription object" });
    }
    
    subscription.lang = lang;

    await db
      .collection("users")
      .doc(userId)
      .collection("pushSubscriptions")
      .doc(subscription.keys.auth) // Use auth key as document ID for uniqueness
      .set(subscription);

    return res.status(200).json({ message: "Subscription saved successfully." });
  } catch (error) {
    console.error("Error in subscribePushHandler:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getVapidPublicKeyHandler = (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(500).json({ error: "VAPID Public Key not configured on server" });
  }
  return res.status(200).json({ publicKey });
};

module.exports = {
  getUserNotificationsHandler,
  markNotificationsAsReadHandler,
  streamNotificationsHandler,
  subscribePushHandler,
  getVapidPublicKeyHandler,
};
