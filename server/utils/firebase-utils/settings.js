const { admin } = require("../../firebase/firebaseAdmin");

const getSettingsContext = async (userId) => {
  try {
    const user = await admin.auth().getUser(userId);
    const providers = user.providerData.map((provider) => provider.providerId);
    const canAddEmail = !user.email;
    const canChangePassword = providers.includes("password");
    const fbProviderIn = providers.indexOf("facebook.com");
    const canChangeEmail =
      providers.includes("password") &&
      (providers.length === 1 ||
        (fbProviderIn !== -1 && !user.providerData[fbProviderIn]?.email));

    const fullName = user.displayName || "";
    const email = user.email || "";
    const photoURL = user.photoURL || "";

    return {
      fullName,
      email,
      userId,
      photoURL,
      canAddEmail,
      canChangePassword,
      canChangeEmail,
    };
  } catch (error) {
    console.error(error);
    return {
      fullName: "",
      email: "",
      photoURL: "",
      userId,
      canAddEmail: false,
      canAddPassword: false,
      canChangePassword: true,
      canChangeEmail: true,
    };
  }
};

module.exports = {
  getSettingsContext,
};
