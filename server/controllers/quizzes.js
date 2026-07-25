const {
  createQuiz,
  modifyQuizQuestions,
  updateQuizTitle,
  updateQuizSubject,
  getQuizResult,
  addQuizResult,
  getSessionQuizzes,
  getQuizzInfo,
  getQuizResultsByGroup,
  isQuizTitleAvailable,
  duplicateQuiz,
  deleteQuiz,
} = require("../utils/firebase-utils/examen");
const { getScoreClass } = require("../utils/global");

const createQuizHandler = async (req, res) => {
  const quizData = req.body.quizData;
  const userData = req.user;
  const result = await createQuiz(quizData, userData.uid);
  if (result.success) {
    return res.status(200).json({ quizId: result.quizId });
  } else {
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
};

const checkQuizTitleHandler = async (req, res) => {
  const { title } = req.body;
  const result = await isQuizTitleAvailable(title, req.user.uid);

  if (!result.success) {
    return res.status(400).json({
      available: false,
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }

  return res.status(200).json({
    available: result.available,
    message: res.locals.t(result.message),
  });
};

const updateQuizHandler = async (req, res) => {
  const updatedQuestions = req.body.updatedQuestions;
  const newQuestions = req.body.newQuestions;
  const deletedQuestions = req.body.deletedQuestions;
  const quizzId = req.params.quizId;
  const userData = req.user;
  const result = await modifyQuizQuestions(
    updatedQuestions,
    newQuestions,
    deletedQuestions,
    quizzId,
    userData.uid,
  );

  if (result.success) {
    return res.status(200).json({ message: res.locals.t(result.message) });
  } else {
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
};

const patchQuizHandler = async (req, res) => {
  const title = req.body.title;
  const subject = req.body.subject;
  const quizId = req.params.quizId;
  const userData = req.user;
  const response = title
    ? await updateQuizTitle(title, quizId, userData.uid)
    : await updateQuizSubject(subject, quizId, userData.uid);

  if (response.success) {
    return res.status(200).json({ message: res.locals.t(response.message) });
  } else {
    return res.status(400).json({
      message: res.locals.t(response.message),
      isNative: response.isNative ?? false,
      type: response.type ?? "error",
    });
  }
};

const getResultsListHandler = async (req, res) => {
  const { quizId, groupId } = req.query;
  const result = await getQuizResultsByGroup(quizId, groupId, req.user.uid);

  if (!result.success) return res.status(400).json({
    message: res.locals.t(result.message),
    isNative: result.isNative ?? false,
    type: result.type ?? "error",
  });

  return res.render(
    "fragments/resullts-list",
    { results: result.results, quizTitle: result.quizTitle, getScoreClass },
    (err, html) => {
      if (err) {
        console.error(err);

        return res
          .status(500)
          .json({ message: res.locals.t("api:error_rendering_results_list"), isNative: false, type: "error" });
      }
      return res.status(200).json({ overlay: html });
    },
  );
};

const getQuizDetailsHandler = async (req, res) => {
  const quizId = req.params.quizId;
  const userId = req.user.uid;
  const result = await getQuizzInfo(quizId, userId);

  if (result.success) {
    return res.status(200).json({ ...result.quizData });
  } else {
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
};

const getQuizzesListHandler = async (req, res) => {
  const { searchTerm, count, lastVisible } = req.query;
  const result = await getSessionQuizzes(
    req.user.uid,
    lastVisible,
    count,
    searchTerm,
  );
  console.log("result  result result: ", result);
  

  return res.status(200).json({
    ...result,
  });
};

const addQuizResultHandler = async (req, res) => {

  const quizResult = req.body.quizResult;
  const userId = req.user.uid;
  const result = await addQuizResult(userId, quizResult);  

  if (result.success) {
    return res.status(200).json({ message: res.locals.t(result.message) });
  } else {
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
};

const getExamenResultHandler = async (req, res) => {
  const { userId, quizId, groupId } = req.query;

  const result = await getQuizResult(userId, quizId, groupId, req.user.uid);

  if (result.success) {
    return res
      .status(200)
      .json({ quizResult: result.quizResult, questions: result.questions });
  } else {
    return res.status(401).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
};

const removeQuizHandler = async (req, res) => {
  const { quizId } = req.params;
  const result = await deleteQuiz(quizId);
  if (result.success) {
    return res.status(200).json({ message: res.locals.t(result.message) });
  } else {
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
};

const duplicateQuizHandler = async (req, res) => {
  const { quizId, title } = req.body;
  const result = await duplicateQuiz(quizId, req.user.uid, title);
  if (result.success) {
    return res.status(200).json(result);
  } else {
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
};

module.exports = {
  createQuizHandler,
  removeQuizHandler,
  updateQuizHandler,
  patchQuizHandler,
  getResultsListHandler,
  getQuizDetailsHandler,
  getQuizzesListHandler,
  addQuizResultHandler,
  getExamenResultHandler,
  checkQuizTitleHandler,
  duplicateQuizHandler,
};
