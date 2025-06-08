const { getGroupChatContext } = require("../utils/groups");
const { fetchData, renderFragmentOrLayout } = require("../utils/routing");

const handleRoutes = async (req, res) => {
  const payload = await fetchData(req.path, req.user);
  const pathName = req.path === "/home" ? payload.pathName : req.path;

  if (pathName === "/home") console.log(payload);

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

const handleGroupChatRoute = (req, res) => {
  const templateContext = getGroupChatContext(req.params.groupId); // Replace with actual logic to get group chat context
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
};

const handleQuizEditRoute = (req, res) => {
  const templateContext = { quizTitle: "Quiz Title" }; // Replace with actual logic to get group chat context
  const extraData = {
    quizTitle: templateContext.quizTitle,
  };
  const payload = {
    templateContext,
    extraData: extraData,
  };
  renderFragmentOrLayout(
    "templates/quizzes/quiz-editor",
    payload,
    "/quizzes/quiz-editor",
    req,
    res,
    extraData
  );
};

const handleQuizPlayRoute = (req, res) => {
  const templateContext = {
    firstQuestion: {
      id: "q1",
      text: "What is the capital of Morocco?",
      choices: ["Casablanca", "Marrakesh", "Fez", "Rabat"],
      correctAnswerIndex: 3, // Rabat
    },
    totalQuestions: 10,
    quizTitle: "Geography Quiz",
  }; // Replace with actual logic to get group chat context
  const payload = {
    templateContext,
  };
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
