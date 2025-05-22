const { getGroupInfoContext, getSessionInfoContext, getMembersListContext, getQuizzesListContext, getDemandesListContext } = require("../utils/groups");

const generateTemplateContext = (req, res, next) => {
  // Determine context based on route
  const { originalUrl } = req;

  switch (true) {
    case originalUrl.includes('/group-info'):
      res.context = getGroupInfoContext();
      break;
    case originalUrl.includes('/session-info'):
      res.context = getSessionInfoContext();
      break;
    case originalUrl.includes('/members-list'):
      res.context = getMembersListContext();
      break;
    case originalUrl.includes('/quizzes-list'):
      res.context = getQuizzesListContext();
      break;
    case originalUrl.includes('/demandes-list'):
      res.context = getDemandesListContext();
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
