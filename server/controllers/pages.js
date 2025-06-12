const {
  getQuizzPlayContext,
  getQuizEditContext,
} = require('../utils/firebase-utils/examen');
const { getGroupChatContext } = require('../utils/groups');
const { fetchData, renderFragmentOrLayout } = require('../utils/routing');

const handleRoutes = async (req, res) => {
  const payload = await fetchData(req.path, req.user);
  const pathName = req.path === '/home' ? payload.pathName : req.path;

  if (pathName === '/home') console.log(payload);

  const template = `templates${
    pathName === '/home'
      ? payload.pathName
      : pathName === '/quizzes'
      ? '/quizzes/quizzes-list'
      : pathName
  }`;
  return renderFragmentOrLayout(
    template,
    req.path === '/home' ? payload.payload : payload,
    pathName,
    req,
    res
  );
};

const handleGroupChatRoute = async (req, res) => {
  const templateContext = await getGroupChatContext(
    req.user.uid,
    req.params.groupId
  ); // Replace with actual logic to get group chat context

  const extraData = {
    groupName: templateContext.groupName,
  };
  const payload = {
    templateContext,
    extraData: extraData,
  };

  renderFragmentOrLayout(
    'templates/groups/group-chat',
    payload,
    '/groups/my/group-chat',
    req,
    res,
    extraData
  );
}; // ! should implement with firebase

const handleQuizEditRoute = async (req, res) => {
  const quizId = req.params.quizId;

  const result = await getQuizEditContext(quizId, req.user.uid);

  if (!result.success) {
    return res.status(500).json({
      message: result.message || 'Failed to load quiz editor',
    });
  }

  const templateContext = result.templateContext;

  const extraData = {
    quizTitle: templateContext.title,
  };
  const payload = {
    templateContext,
    extraData: extraData,
  };

  renderFragmentOrLayout(
    'templates/quizzes/quiz-editor',
    payload,
    '/quizzes/my/quiz-editor',
    req,
    res,
    extraData
  );
};

const handleQuizPlayRoute = async (req, res) => {
  const response = await getQuizzPlayContext(req.user.uid, req.params.quizId);
  const templateContext = response.templateContext;
  const payload = {
    templateContext,
  };
  if (!response.success) {
    const backUrl = req.header('Referer') || '/app/home';
    return res.redirect(backUrl);
  }

  renderFragmentOrLayout(
    'templates/quiz-play',
    payload,
    '/quiz-play',
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
