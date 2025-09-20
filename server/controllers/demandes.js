const {
  acceptRequest,
  rejectRequest,
} = require("../utils/firebase-utils/demandes");

const rejectDemandeHandler = async (req, res) => {
  const { demandeId, groupId } = req.body;
  // TODO: Implement rejectDemande logic
  const result = await rejectRequest(groupId, demandeId, req.user.uid);
    console.log("demandeId: ", demandeId);
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
};

const acceptDemandeHandler = async (req, res) => {
  const { demandeId, groupId } = req.body;
  console.log("demandeId: ", demandeId);

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
