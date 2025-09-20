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
      .json({ success: false, message: "Failed to fetch user info." });
  }

  res.json({ email: result.email, provider: result.provider });
};

const updateEmailHandler = async (req, res) => {
  const { newEmail, idToken } = req.body;

  const result = await updateEmail(newEmail, idToken, req.user.uid);
  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: result.message || "Failed to update email.",
    });
  }
  res.json({ success: true, message: "Email updated successfully." });
};

const addEmailHandler = async (req, res) => {
  const { email, idToken } = req.body;
  const result = await addEmail(email, idToken, req.user.uid);
  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: result.message || "Failed to add email.",
    });
  }
  res.json({ success: true, message: "Email added successfully." });
};

const updatePofileHandler = async (req, res) => {
  const avatar = req.file;
  const fullName  = req.body.fullName;
  const result = await updateProfile(fullName, avatar, req.user);

  if (!result.success) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update full name." });
  }

  res.json({ success: true, message: "Full name updated successfully." });
};

const updatePasswordHandler = async (req, res) => {
  const { newPassword, idToken } = req.body;
  const result = await updatePassword(newPassword, idToken, req.user.uid);
  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: result.message || "Failed to update password.",
    });
  }
  res.json({ success: true, message: "Password updated successfully." });
};

const addPasswordHandler = async (req, res) => {
  const { password, idToken } = req.body;
  const result = await addPassword(password, idToken, req.user.uid);
  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: result.message || "Failed to add password.",
    });
  }
  res.json({ success: true, message: "Password added successfully." });
};

const closeAccountHandler = async (req, res, next) => {
  const { idToken } = req.body;
  const result = await closeAccount(idToken, req.user.uid);
  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: result.message || "Failed to close account.",
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
