const { getGroupChatContext } = require("../utils/groups");
const { fetchData, renderFragmentOrLayout } = require("../utils/routing");

const handleRoutes = (req, res) => {
  const templateContext = fetchData(req.path);
  const pathName = req.path === '/home' ? templateContext.pathName : req.path;

  const template = `templates${
    pathName === '/home'
      ? templateContext.pathName
      : pathName === '/quizzes'
      ? '/quizzes/quizzes-list'
      : pathName
  }`;

  return renderFragmentOrLayout(
    template,
    req.path === '/home' ? templateContext.templateContext : templateContext,
    pathName,
    req,
    res
  );
};

const handleGroupChatRoute = (req, res) => {
  const templateContext = getGroupChatContext(req.params.groupId); // Replace with actual logic to get group chat context

  renderFragmentOrLayout(
    'templates/groups/group-chat',
    templateContext,
    '/groups/my/group-chat',
    req,
    res,
    {
      groupName: templateContext.groupName,
    }
  );
};

module.exports = {
  handleRoutes,
  handleGroupChatRoute,
};