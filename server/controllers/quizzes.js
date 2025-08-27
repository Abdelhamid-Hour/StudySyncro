const {
  createExamen,
  modifyQuizQuestions,
  updateQuizTitle,
  updateQuizSubject,
  getQuizResult,
  addQuizResult,
  getSessionQuizzes,
  getQuizzInfo,
  getQuizResultsList,
} = require("../utils/firebase-utils/examen");

const createQuizHandler = async (req, res) => {
  const quizData = req.body.quizData;
  const userData = req.user;
  console.log(quizData, "this is the quizz data");
  const result = await createExamen(quizData, userData);
  if (result.success) {
    console.log(result.quizId, "quizz id");
    return res.status(200).json({ quizId: result.quizId });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
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
    userData.uid
  );

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
};

const patchQuizHandler = async (req, res) => {
  const title = req.body.title;
  const subject = req.body.subject;
  const quizId = req.params.quizId;
  const userData = req.user;
  console.log(title, subject, "quiz data for update quiz");
  const response = title
    ? await updateQuizTitle(title, quizId, userData.uid)
    : await updateQuizSubject(subject, quizId, userData.uid);

  if (response.success) {
    return res.status(200).json({ message: response.message });
  } else {
    return res.status(400).json({
      message: response.message,
    });
  }
};

const getResultsListHandler = async (req, res) => {
  const { quizId } = req.query;
  const result = await getQuizResultsList(quizId, req.user.uid);

  if (!result.success) return res.status(400).json({ message: result.message });

  return res.render(
    "fragments/resullts-list",
    { results: result.results, quizTitle: result.quizTitle },
    (err, html) => {
      if (err) {
        console.error(err);

        return res
          .status(500)
          .json({ message: "Error rendering results list" });
      }
      return res.status(200).json({ overlay: html });
    }
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
      message: result.message,
    });
  }
};

const getQuizzesListHandler = async (req, res) => {
  const { searchTerm, count, lastVisible } = req.query;
  const result = await getSessionQuizzes(
    req.user.uid,
    lastVisible,
    count,
    searchTerm
  );

  return res.status(200).json({
    ...result,
  });
};

const addQuizResultHandler = async (req, res) => {
  const quizResult = req.body.quizResult;
  const userId = req.user.uid;
  const result = await addQuizResult(userId, quizResult);

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
};

const getExamenResultHandler = async (req, res) => {
  const { userId, quizId } = req.query;

  const result = await getQuizResult(userId, quizId, req.user.uid);

  if (result.success) {
    return res
      .status(200)
      .json({ quizResult: result.quizResult, questions: result.questions });
  } else {
    return res.status(401).json({ message: result.message });
  }
};

module.exports = {
  createQuizHandler,
  updateQuizHandler,
  patchQuizHandler,
  getResultsListHandler,
  getQuizDetailsHandler,
  getQuizzesListHandler,
  addQuizResultHandler,
  getExamenResultHandler  
};
