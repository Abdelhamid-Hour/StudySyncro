const { admin, db, bucket, rDb } = require("../../firebase/firebaseAdmin");
const { uploadFileToStorage } = require("./shared");

const updateProfile = async (fullName, avatar, user) => {
  try {
    if (fullName) {
      await admin.auth().updateUser(user.uid, { displayName: fullName });
      await db.collection("users").doc(user.uid).update({ fullName });
    }
    if (avatar) {
      const oldAvatarRef = bucket.file(`avatars/${user.uid}`);
      const [exists] = await oldAvatarRef.exists();
      if (exists) await oldAvatarRef.delete();
      const result = await uploadFileToStorage(
        `avatars/${user.uid}`,
        avatar,
        true,
      );
      if (!result.success)
        return {
          success: false,
          message: result.message,
          isNative: result.isNative ?? false,
          type: result.type ?? "error",
        };
      await admin.auth().updateUser(user.uid, { photoURL: result.URL });
      await db
        .collection("users")
        .doc(user.uid)
        .update({ photoURL: result.URL });
    }
    return { success: true };
  } catch (error) {
    console.error("Error updating full name:", error);
    return {
      success: false,
      message: "Failed to update full name.",
      isNative: false,
      type: "error",
    };
  }
};

const getUserInfo = async (userId) => {
  try {
    const userRecord = await admin.auth().getUser(userId);
    const providers = userRecord.providerData.map(
      (provider) => provider.providerId,
    );
    return {
      success: true,
      email: userRecord.email,
      provider: providers.includes("facebook.com")
        ? "facebook.com"
        : providers.includes("google.com")
          ? "google.com"
          : "password",
    };
  } catch (error) {
    console.error("Error fetching user info:", error);
    return {
      success: false,
      message: "Failed to fetch user info.",
      isNative: false,
      type: "error",
    };
  }
};

const verifyUser = async (userId, key) => {
  try {
    const credentials = await admin.auth().verifyIdToken(key);
    const user = await db.collection("users").doc(credentials.uid).get();
    if (!user.exists) {
      admin.auth().deleteUser(credentials.uid);
      return {
        success: false,
        message: "Please choose the correct account.",
        isNative: true,
        type: "warning",
      };
    }

    if (credentials.uid !== userId)
      return {
        success: false,
        message: "Please choose the correct account.",
        isNative: true,
        type: "warning",
      };

    return { success: true };
  } catch (error) {
    console.error("Error verifying user:", error);
    return {
      success: false,
      message: "User verification failed.",
      isNative: false,
      type: "error",
    };
  }
};

const updateEmail = async (newEmail, idToken, userId) => {
  try {
    const res = await verifyUser(userId, idToken);
    if (!res.success) {
      return res;
    }

    const userRecord = await admin.auth().getUser(userId);
    const providers = userRecord.providerData.map(
      (provider) => provider.providerId,
    );

    if (
      providers.length === 1 &&
      providers[0] !== "password" &&
      userRecord.providerData[0].email
    ) {
      return {
        success: false,
        message:
          "The account is linked to a social provider. Cannot change email.",
        isNative: true,
        type: "warning",
      };
    }

    if (!userRecord.email) {
      return {
        success: false,
        message: "No existing email to update.",
        isNative: true,
        type: "warning",
      };
    }

    await admin.auth().updateUser(userId, { email: newEmail });
    await db.collection("users").doc(userId).update({ email: newEmail });
    return { success: true, message: "Email updated successfully." };
  } catch (error) {
    console.error("Error updating email:", error);
    return {
      success: false,
      message: "Failed to update email.",
      isNative: false,
      type: "error",
    };
  }
};

const addEmail = async (email, key, userId) => {
  try {
    const res = await verifyUser(userId, key);
    if (!res.success) {
      return res;
    }

    const userRecord = await admin.auth().getUser(userId);

    if (userRecord.email) {
      return {
        success: false,
        message: "Email already exists.",
        isNative: true,
        type: "warning",
      };
    }

    await admin.auth().updateUser(userId, { email });
    await db.collection("users").doc(userId).set({ email }, { merge: true });
    return { success: true, message: "Email added successfully." };
  } catch (error) {
    console.error("Error adding email:", error);
    return {
      success: false,
      message: "Failed to add email.",
      isNative: false,
      type: "error",
    };
  }
};

const addPassword = async (password, key, userId) => {
  try {
    const res = await verifyUser(userId, key);
    if (!res.success) {
      return res;
    }

    const userRecord = await admin.auth().getUser(userId);
    const providers = userRecord.providerData.map(
      (provider) => provider.providerId,
    );

    if (providers.includes("password")) {
      return {
        success: false,
        message: "Password already set for this account.",
        isNative: true,
        type: "warning",
      };
    }

    await admin.auth().updateUser(userId, { password });
    return { success: true, message: "Password added successfully." };
  } catch (error) {
    console.error("Error adding password:", error);
    return {
      success: false,
      message: "Failed to add password.",
      isNative: false,
      type: "error",
    };
  }
};

const updatePassword = async (newPassword, key, userId) => {
  try {
    const res = await verifyUser(userId, key);
    if (!res.success) {
      return res;
    }

    const userRecord = await admin.auth().getUser(userId);
    const providers = userRecord.providerData.map(
      (provider) => provider.providerId,
    );

    if (!providers.includes("password")) {
      return {
        success: false,
        message: "No password set for this account.",
        isNative: true,
        type: "warning",
      };
    }

    await admin.auth().updateUser(userId, { password: newPassword });
    return { success: true, message: "Password updated successfully." };
  } catch (error) {
    console.error("Error updating password:", error);
    return {
      success: false,
      message: "Failed to update password.",
      isNative: false,
      type: "error",
    };
  }
};

const closeAccount = async (key, userId) => {
  try {
    const res = await verifyUser(userId, key);

    if (!res.success) {
      return res;
    }

    await admin.auth().deleteUser(userId);
    await db.collection("users").doc(userId).delete();
    await db.collection("notifications").doc(userId).delete();
    await rDb.ref(`userGroupChats/${userId}`).remove();

    return { success: true, message: "Account closed successfully." };
  } catch (error) {
    console.error("Error closing account:", error);
    return {
      success: false,
      message: "Failed to close account.",
      isNative: false,
      type: "error",
    };
  }
};

module.exports = {
  updateProfile,
  getUserInfo,
  verifyUser,
  addEmail,
  addPassword,
  closeAccount,
  updateEmail,
  updatePassword,
};
