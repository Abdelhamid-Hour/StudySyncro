const { admin, db, bucket, rDb } = require("../../firebase/firebaseAdmin");
const { uploadFileToStorage } = require("./shared");

const updateProfile = async (fullName, avatar, user) => {
  try {
    let newPhotoUrl = null;

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
      
      newPhotoUrl = result.URL;
      await admin.auth().updateUser(user.uid, { photoURL: newPhotoUrl });
      await db
        .collection("users")
        .doc(user.uid)
        .update({ photoURL: newPhotoUrl });
    }

    if (fullName || newPhotoUrl) {
      const quizResultsSnap = await db
        .collection("quizResults")
        .where("userId", "==", user.uid)
        .get();

      if (!quizResultsSnap.empty) {
        let batch = db.batch();
        let count = 0;
        const updates = {};
        if (fullName) updates.userFullName = fullName;
        if (newPhotoUrl) updates.photoURL = newPhotoUrl;

        for (const doc of quizResultsSnap.docs) {
          batch.update(doc.ref, updates);
          count++;
          if (count === 500) {
            await batch.commit();
            batch = db.batch();
            count = 0;
          }
        }
        if (count > 0) {
          await batch.commit();
        }
      }
    }
    return { success: true };
  } catch (error) {
    console.error("Error updating full name:", error);
    return {
      success: false,
      message: "api:failed_to_update_full_name",
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
      message: "api:failed_to_fetch_user_info",
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
        message: "api:please_choose_the_correct_account",
        isNative: true,
        type: "warning",
      };
    }

    if (credentials.uid !== userId)
      return {
        success: false,
        message: "api:please_choose_the_correct_account",
        isNative: true,
        type: "warning",
      };

    return { success: true };
  } catch (error) {
    console.error("Error verifying user:", error);
    return {
      success: false,
      message: "api:user_verification_failed",
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
        message: "api:the_account_is_linked_to_a_social_provider_cannot_",
        isNative: true,
        type: "warning",
      };
    }

    if (!userRecord.email) {
      return {
        success: false,
        message: "api:no_existing_email_to_update",
        isNative: true,
        type: "warning",
      };
    }

    await admin.auth().updateUser(userId, { email: newEmail, emailVerified: false });
    await db.collection("users").doc(userId).update({ email: newEmail });

    // The old idToken is stale after updateUser, so we mint a fresh one
    const apiKey = process.env.FIREBASE_API_KEY;
    const customToken = await admin.auth().createCustomToken(userId);
    const tokenRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      }
    );
    const tokenData = await tokenRes.json();

    if (tokenData.idToken) {
      await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestType: "VERIFY_EMAIL",
            idToken: tokenData.idToken,
          }),
        }
      );
    }

    return { success: true, message: "api:email_updated_check_inbox" };
  } catch (error) {
    console.error("Error updating email:", error);
    return {
      success: false,
      message: "api:failed_to_update_email",
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
        message: "api:email_already_exists",
        isNative: true,
        type: "warning",
      };
    }

    await admin.auth().updateUser(userId, { email, emailVerified: false });
    await db.collection("users").doc(userId).set({ email }, { merge: true });

    // The old idToken is stale after updateUser, so we mint a fresh one
    const apiKey = process.env.FIREBASE_API_KEY;
    const customToken = await admin.auth().createCustomToken(userId);
    const tokenRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      }
    );
    const tokenData = await tokenRes.json();

    if (tokenData.idToken) {
      await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestType: "VERIFY_EMAIL",
            idToken: tokenData.idToken,
          }),
        }
      );
    }

    return { success: true, message: "api:email_added_check_inbox" };
  } catch (error) {
    console.error("Error adding email:", error);
    return {
      success: false,
      message: "api:failed_to_add_email",
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
        message: "api:password_already_set_for_this_account",
        isNative: true,
        type: "warning",
      };
    }

    await admin.auth().updateUser(userId, { password });
    return { success: true, message: "api:password_added_successfully" };
  } catch (error) {
    console.error("Error adding password:", error);
    return {
      success: false,
      message: "api:failed_to_add_password",
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
        message: "api:no_password_set_for_this_account",
        isNative: true,
        type: "warning",
      };
    }

    await admin.auth().updateUser(userId, { password: newPassword });
    return { success: true, message: "api:password_updated_successfully" };
  } catch (error) {
    console.error("Error updating password:", error);
    return {
      success: false,
      message: "api:failed_to_update_password",
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

    return { success: true, message: "api:account_closed_successfully" };
  } catch (error) {
    console.error("Error closing account:", error);
    return {
      success: false,
      message: "api:failed_to_close_account",
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
