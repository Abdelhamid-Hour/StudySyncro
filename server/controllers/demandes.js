const { acceptRequest, rejectRequest } = require("../utils/firebase-utils/demandes");

const rejectDemandeHandler = async (req, res) => {
  const { demandeId, groupId } = req.body;
  // TODO: Implement rejectDemande logic
  const result = await rejectRequest(groupId, demandeId, req.user.uid);
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
};

const acceptDemandeHandler = async (req, res) => {
  console.log(req.body, "body");
  const { demandeId, groupId } = req.body;
  const result = await acceptRequest(groupId, demandeId, req.user.uid);
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
};

module.exports = {
  acceptDemandeHandler,
  rejectDemandeHandler,
};
