const {
  createExamen,
  modifyQuizQuestions,
  updateQuizTitle,
  updateQuizSubject,
} = require('../utils/firebase-utils/examen');

const createQuizHandler = async (req, res) => {
  const quizData = req.body.quizData;
  const userData = req.user;
  console.log(quizData, 'this is the quizz data');
  const result = await createExamen(quizData, userData);
  if (result.success) {
    console.log(result.quizId, 'quizz id');
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
  console.log(title, subject, 'quiz data for update quiz');
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

module.exports = {
  createQuizHandler,
  updateQuizHandler,
  patchQuizHandler,
};
