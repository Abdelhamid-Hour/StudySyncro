const {
  updateProfile,
  getUserInfo,
  updateEmail,
  updatePassword,
  closeAccount,
  addPassword,
} = require("../utils/firebase-utils/user");

const getUserInfoHandler = async (req, res) => {
  const result = await getUserInfo(req.user.uid);

  if (!result.success) {
    return res
      .status(500)
      .json({
        success: false,
        message: res.locals.t("api:failed_to_fetch_user_info"),
        isNative: result.isNative ?? false,
        type: result.type ?? "error",
      });
  }

  res.json({ email: result.email, provider: result.provider });
};

const updateEmailHandler = async (req, res) => {
  const { newEmail, idToken } = req.body;

  const result = await updateEmail(newEmail, idToken, req.user.uid);
  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: res.locals.t(result.message) || "Failed to update email.",
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
  res.json({ success: true, message: res.locals.t("api:email_updated_successfully") });
};

const addEmailHandler = async (req, res) => {
  const { email, idToken } = req.body;
  const result = await addEmail(email, idToken, req.user.uid);
  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: res.locals.t(result.message) || "Failed to add email.",
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
  res.json({ success: true, message: res.locals.t("api:email_added_successfully") });
};

const updatePofileHandler = async (req, res) => {
  const avatar = req.file;
  const fullName  = req.body.fullName;
  const result = await updateProfile(fullName, avatar, req.user);

  if (!result.success) {
    return res
      .status(500)
      .json({
        success: false,
        message: res.locals.t("api:failed_to_update_full_name"),
        isNative: result.isNative ?? false,
        type: result.type ?? "error",
      });
  }

  res.json({ success: true, message: res.locals.t("api:full_name_updated_successfully") });
};

const updatePasswordHandler = async (req, res) => {
  const { newPassword, idToken } = req.body;
  const result = await updatePassword(newPassword, idToken, req.user.uid);
  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: res.locals.t(result.message) || "Failed to update password.",
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
  res.json({ success: true, message: res.locals.t("api:password_updated_successfully") });
};

const addPasswordHandler = async (req, res) => {
  const { password, idToken } = req.body;
  const result = await addPassword(password, idToken, req.user.uid);
  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: res.locals.t(result.message) || "Failed to add password.",
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
  res.json({ success: true, message: res.locals.t("api:password_added_successfully") });
};

const closeAccountHandler = async (req, res, next) => {
  const { idToken } = req.body;
  const result = await closeAccount(idToken, req.user.uid);
  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: res.locals.t(result.message) || "Failed to close account.",
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }

  next();
};

module.exports = {
  updatePofileHandler,
  closeAccountHandler,
  getUserInfoHandler,
  updateEmailHandler,
  addEmailHandler,
  updatePasswordHandler,
  addPasswordHandler,
};
