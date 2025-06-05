const { getSessionDetails } = require("../utils/home");

const setSessionDetails = (req, res, next) => {
  const sessionId = req.params.id;
  // !! TODO: Fetch session details from the database using sessionId
  res.session = getSessionDetails(sessionId)

  next();
};

module.exports = {
  setSessionDetails,
};
