const {
  acceptRequest,
  rejectRequest,
} = require("../utils/firebase-utils/demandes");

const rejectDemandeHandler = async (req, res) => {
  const { demandeId, groupId } = req.body;
  // TODO: Implement rejectDemande logic
  const result = await rejectRequest(groupId, demandeId, req.user.uid);
  if (result.success) {
    return res.status(200).json({ message: res.locals.t(result.message) });
  } else {
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
};

const acceptDemandeHandler = async (req, res) => {
  const { demandeId, groupId } = req.body;

  const result = await acceptRequest(groupId, demandeId, req.user.uid);
  if (result.success) {
    return res.status(200).json({ message: res.locals.t(result.message) });
  } else {
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
};

module.exports = {
  acceptDemandeHandler,
  rejectDemandeHandler,
};
