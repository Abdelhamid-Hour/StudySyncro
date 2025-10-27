const {
  getQuizzPlayContext,
  getQuizEditContext,
} = require("../utils/firebase-utils/examen");
const { st } = require("../utils/firebase-utils/session");
const { formatNumber } = require("../utils/global");
const { getGroupChatContext } = require("../utils/groups");
const { fetchData, renderFragmentOrLayout } = require("../utils/routing");

const handleRoutes = async (req, res) => {
  st()
  const payload = await fetchData(req.path, req.user);
  const pathName = req.path === "/home" ? payload.pathName : req.path;

  const template = `templates${
    pathName === "/home"
      ? payload.pathName
      : pathName === "/quizzes"
      ? "/quizzes/quizzes-list"
      : pathName
  }`;
  return renderFragmentOrLayout(
    template,
    req.path === "/home" ? payload.payload : payload,
    pathName,
    req,
    res
  );
};

const handleGroupChatRoute = async (req, res) => {
  const result = await getGroupChatContext(req.user.uid, req.params.groupId); // Replace with actual logic to get group chat context
  
  if (!result.success) {
    return res.status(result.statusCode).json({
      message: result.message || "Failed to load group chat",
    });
  }

  const templateContext = result.templateContext;

  const extraData = {
    groupName: templateContext.groupName,
  };
  const payload = {
    templateContext,
    extraData: extraData,
  };

  renderFragmentOrLayout(
    "templates/groups/group-chat",
    payload,
    "/groups/my/group-chat",
    req,
    res,
    extraData
  );
}; // ! should implement with firebase

const handleQuizEditRoute = async (req, res) => {
  const quizId = req.params.quizId;

  const result = await getQuizEditContext(quizId, req.user.uid);

  if (!result.success) {
    return res.status(result.statusCode).json({
      message: result.message || "Failed to load quiz editor",
    });
  }

  const templateContext = { ...result.templateContext, formatNumber };

  const extraData = {
    quizTitle: templateContext.title,
  };
  const payload = {
    templateContext,
    extraData: extraData,
  };

  renderFragmentOrLayout(
    "templates/quizzes/quiz-editor",
    payload,
    "/quizzes/my/quiz-editor",
    req,
    res,
    extraData
  );
};

const handleQuizPlayRoute = async (req, res) => {
  const response = await getQuizzPlayContext(
    req.user,
    req.params.quizId,
    req.query.groupId
  );
  const templateContext = response.templateContext;

  const payload = {
    templateContext,
  };

  if (!response.success) {
    const backUrl = req.header("Referer") || "/app/home";
    return res.redirect(backUrl);
  }

  renderFragmentOrLayout(
    "templates/quiz-play",
    payload,
    "/quiz-play",
    req,
    res
  );
};

module.exports = {
  handleRoutes,
  handleGroupChatRoute,
  handleQuizEditRoute,
  handleQuizPlayRoute,
};
