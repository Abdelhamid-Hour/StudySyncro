const {
  getGroupInfoContext,
  getSessionInfoContext,
  getMembersListContext,
  getQuizzesListContext,
  getDemandesListContext,
  getResultsListContext,
} = require("../utils/groups");

const generateTemplateContext = async (req, res, next) => {
  // Determine context based on route
  const { originalUrl } = req;

  switch (true) {
    case originalUrl.includes("/group-info"):
      res.payload = await getGroupInfoContext(req.params.id, req.user);
      break;
    case originalUrl.includes("/session-info"):
      res.payload = await getSessionInfoContext(req.params.id, req.user.uid);
      break;
    case originalUrl.includes("/members-list"):
      res.payload = await getMembersListContext(req.params.id, req.user);
      break;
    case originalUrl.includes("/quizzes-list"):
      res.payload = await getQuizzesListContext(req.params.id, req.user.uid);
      break;
    case originalUrl.includes("/demandes-list"):
      res.payload = await getDemandesListContext(req.params.id);
      break;
    case originalUrl.includes("/results-list"):
      res.payload = await getResultsListContext(req.query.quizId, req.params.id, req.user.uid);
      break;
    default:
      res.payload = {};
      break;
  }

  next();
};

module.exports = {
  generateTemplateContext,
};
