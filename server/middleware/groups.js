const { getGroupInfoContext, getSessionInfoContext, getMembersListContext, getQuizzesListContext, getDemandesListContext } = require("../utils/groups");

const generateTemplateContext =async (req, res, next) => {
  // Determine context based on route
  const { originalUrl } = req;

  switch (true) {
    case originalUrl.includes('/group-info'):
      res.context = await getGroupInfoContext(req.params.id , req.user);
      break;
    case originalUrl.includes('/session-info'):
      res.context = getSessionInfoContext();
      break;
    case originalUrl.includes('/members-list'):
      res.context = await getMembersListContext(req.params.id , req.user);
      break;
    case originalUrl.includes('/quizzes-list'):
      res.context = getQuizzesListContext();
      break;
    case originalUrl.includes('/demandes-list'):
      res.context = await getDemandesListContext(req.params.id , req.user);
      break;
    default:
      res.context = {};
      break;
  }

  next();
};

module.exports = {
    generateTemplateContext,
};
