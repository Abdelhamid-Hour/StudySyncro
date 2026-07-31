const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../../firebase/firebaseAdmin");

const getQuestions = async (quizId) => {
  try {
    let questions = [];
    const questionRef = db
      .collection("quizzes")
      .doc(quizId)
      .collection("questions");
    const questionsSnap = await questionRef.get();

    if (questionsSnap.empty) return questions;

    questions = questionsSnap.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        text: data.text,
        choices: data.choices,
        correctAnswerIndex: data.correctAnswerIndex,
      };
    });
    return questions;
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

const getQuizDuration = async (user) => {
  try {
    let duration = 0;

    const sessionRf = db.collection("sessions");
    const sessionSnap = user.currentSession
      ? await sessionRf.doc(user.currentSession).get()
      : null;
    const session = sessionSnap && sessionSnap.exists ? sessionSnap.data() : {};
    const taskRef = db
      .collection("tasks")
      .where("sessionId", "==", user.currentSession);
    const activeTasksSnap = await taskRef.where("status", "==", "active").get();
    const pendingTasksSnap = await taskRef
      .where("status", "==", "pending")
      .get();
    const activeTask =
      activeTasksSnap.docs.length > 0 ? activeTasksSnap.docs[0].data() : {};
    const timeLeft = Date.now() - new Date(session.startDate).getTime();

    if (activeTask && activeTask.isQuiz && sessionSnap.exists) {
      if (timeLeft < session.duration * 60000) {
        const elapsedTime = Math.floor(session.duration * 60000 - timeLeft);

        const totalPendingTasksDuration = pendingTasksSnap.docs.reduce(
          (accumulated, doc) => {
            const data = doc.data();
            accumulated += data.durationInMins * 60000; // Convert minutes to milliseconds
            return accumulated;
          },
          0
        );

        duration = elapsedTime - totalPendingTasksDuration;
      }
    } else {
      duration = null;
    }
    return duration;
  } catch (error) {
    console.error(error);
    return false;
  }
};

module.exports = {
  getQuestions,
  getQuizDuration,
};
