const { getSessionDetails } = require("../utils/home");

const setSessionDetails = async (req, res, next) => {
  const sessionId = req.params.id;
  
  // !! TODO: Fetch session details from the database using sessionId
  res.sessionResult = await getSessionDetails(sessionId)

  next();
};

module.exports = {
  setSessionDetails,
};
