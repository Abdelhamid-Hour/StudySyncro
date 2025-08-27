const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../../firebase/firebaseAdmin");
const { getQuestions } = require("./question");
const { toReadableDate } = require("../global");

class QuizResult {
  constructor(resultDetails, user) {
    this.resultDetails = resultDetails;
    this.user = user;
    resultDetails.submittedAt = toReadableDate(resultDetails.submittedAt);
    this.score = this.calculateScore();
  }

  static async create(resultDetails) {
    const userSnap = await db
      .collection("users")
      .doc(resultDetails.userId)
      .get();
    return new QuizResult(resultDetails, userSnap.data());
  }

  calculateScore() {
    const totalQuestions =
      this.resultDetails.correctAnswers.length +
      this.resultDetails.incorrectAnswers.length +
      this.resultDetails.skippedQuestions.length;
    const score =
      (this.resultDetails.correctAnswers.length / totalQuestions) * 100 || 0;
    return Math.round(score); // Return score as a string with one decimal place
  }
}

// Example fake object for this template:
const fakeQuizResult = new QuizResult(
  {
    userId: "user123",
    quizId: "quiz456",
    correctAnswers: [1, 3, 5],
    incorrectAnswers: [{ id: 2, answerIndex: 4 }],
    skippedQuestions: [6],
    submittedCount: 4,
    submittedAt: new Date().toISOString(),
  },
  {
    id: "user123",
    fullName: "John Doe",
  }
);

// Usage example:
console.log(fakeQuizResult);

const getFormatedQuizzes = (quizzes) => {
  return quizzes.map(
    ({ id, title, subject, questionsCount, sessionsCount, groupsCount }) => ({
      id: id,
      title: title,
      questionsCount: questionsCount,
      sharedGroups: groupsCount,
      sharedSessions: sessionsCount,
      subject: subject,
    })
  );
};

const getExams = async (
  userId,
  criteria,
  limit = 5,
  lastVisible = null,
  oldExams = []
) => {
  try {
    let availableExams = [...oldExams];

    // Return early if we already have enough exams
    if (availableExams.length >= limit) {
      const formattedExams = getFormatedQuizzes(
        availableExams.slice(0, limit),
        userId
      );
      return { cards: formattedExams, lastVisible };
    }

    let query = db.collection("quizzes").where("creator", "==", userId);

    // Pagination logic
    if (typeof lastVisible === "string" && lastVisible.trim() !== "") {
      const doc = db.collection("quizzes").doc(lastVisible);
      const lastElement = await doc.get();
      query = query.startAfter(lastElement);
    } else if (lastVisible) {
      query = query.startAfter(lastVisible);
    }

    // Fetch more than limit to account for filtering
    const need = limit - availableExams.length;
    const batchSize = Math.max(need * 2, 20);
    query = query.limit(batchSize);

    const snapshot = await query.get();

    if (snapshot.empty && availableExams.length === 0) {
      return { cards: [], lastVisible: null };
    }

    if (snapshot.empty) {
      const formattedExams = getFormatedQuizzes(availableExams, userId);
      return { cards: formattedExams, lastVisible: null };
    }

    // Convert documents to quiz objects
    let exams = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply filter if provided
    const filteredExams = criteria
      ? await filtrerExamen(criteria, exams)
      : exams;

    availableExams = availableExams.concat(filteredExams);

    const newLastVisible = snapshot.docs[snapshot.docs.length - 1];
    const isLastBatch = snapshot.docs.length < batchSize;
    const hasEnoughExams = availableExams.length >= limit;

    if (hasEnoughExams || isLastBatch) {
      const examsToReturn = availableExams.slice(0, limit);
      const formattedExams = getFormatedQuizzes(examsToReturn, userId);

      const finalLastVisible =
        isLastBatch || availableExams.length <= limit
          ? null
          : newLastVisible.id;

      return { cards: formattedExams, lastVisible: finalLastVisible };
    }

    // Recursive call to get more exams
    return await getExams(
      userId,
      criteria,
      limit,
      newLastVisible.id,
      availableExams
    );
  } catch (error) {
    console.error(error.message, "error in getExams");
    return {
      cards: getFormatedQuizzes(oldExams, userId),
      lastVisible,
    };
  }
};

const createExamen = async (examenData, userData) => {
  try {
    const examenRef = db.collection("quizzes");
    const snaphsot = await examenRef
      .where("title", "==", examenData["quiz-title"])
      .where("creator", "==", userData.uid)
      .get();
    if (snaphsot.empty) {
      const newExamen = {
        title: examenData["quiz-title"],
        subject: examenData.subject,
        creator: userData.uid,
        sessionsCount: 0,
        groupsCount: 0,
        createdAt: new Date().toISOString(),
        questionsCount: 0,
        usersIds: [],
        usersIdsByGroup: {},
      };
      const docRef = await examenRef.add(newExamen);
      const result = {
        success: true,
        quizId: docRef.id, // This should be replaced with actual logic to create a quiz
        message: "Quiz created successfully",
      };
      return result;
    } else {
      return {
        success: false,
        message: "A quizz already exist with the same title",
      };
    }
  } catch (error) {
    console.log(error.message);
    return {
      success: false,
      message: "Error creating the quizz",
    };
  }
};

const supprimerExamen = async (examenId) => {
  try {
    const examenRef = db.collection("quizzes").doc(examenId);
    if (examenRef) {
      await examenRef.delete();
      return true;
    }
    return false;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const filtrerExamen = async (criteria, examens) => {
  try {
    const quizzes = examens.filter((ex) => {
      let matchSearch = true;
      const searchTerm = criteria.searchTerm.trim().toLowerCase();
      if (searchTerm) {
        matchSearch =
          searchTerm.trim() === "" ||
          ex.subject.toLowerCase().includes(searchTerm) ||
          ex.title.toLowerCase().includes(searchTerm);
      }

      return matchSearch;
    });
    let sortedExams = quizzes;

    if (criteria.sort === "desc" && quizzes.length >= 2) {
      sortedExams = examens.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
    } else if (criteria.sort === "asc" && quizzes.length >= 2) {
      sortedExams = examens.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateA - dateB;
      });
    }
    return sortedExams;
  } catch (error) {
    console.log(error.message, "error here ");
    return false;
  }
};
const createQuestion = async (questionData) => {
  try {
    const questionsRef = db.collection("questions");
    if (questionsRef) {
      const newQuestion = {
        text: questionData.text,
        choix: questionData.choix,
        reponse: questionData.reponse,
        examenId: questionData.examenId,
      };
      await setDoc(doc(db, "questions", id), newQuestion);
      return true;
    }
    return false;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const updateQuizTitle = async (title, id, userId) => {
  try {
    const ref = db.collection("quizzes").doc(id);
    const snapShot = await ref.get();
    const quiz = snapShot.data();
    if (snapShot.exists && quiz.creator === userId) {
      await ref.update({
        title: title,
      });
      return {
        success: true,
        message: "Quiz title updated successfully",
      };
    } else {
      return {
        success: false,
        message: "Quiz id is not valid",
      };
    }
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Could not update  the quiz title",
    };
  }
};
const updateQuizSubject = async (subject, id, userId) => {
  try {
    const ref = db.collection("quizzes").doc(id);
    const snapShot = await ref.get();
    const quiz = snapShot.data();
    if (snapShot.exists && quiz.creator === userId) {
      await ref.update({
        subject: subject,
      });
      return {
        success: true,
        message: "Quiz subject updated successfully",
      };
    } else {
      return {
        success: false,
        message: "Quiz id is not valid",
      };
    }
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Could not update the quiz subject",
    };
  }
};

const getQuizzPlayContext = async (user, quizId) => {
  try {
    const sessionSnap = user.currentSession
      ? await db.collection("sessions").doc(user.currentSession).get()
      : null;
    const session = sessionSnap && sessionSnap.exists ? sessionSnap.data() : {};
    const taskSnap = user.currentSession
      ? await db
          .collection("tasks")
          .where("sessionId", "==", user.currentSession)
          .where("status", "==", "active")
          .get()
      : null;
    const task = taskSnap && !taskSnap.empty ? taskSnap.docs[0].data() : {};
    const quizSnap = await db.collection("quizzes").doc(quizId).get();

    if (!quizSnap) {
      console.log("Quiz not found");

      return {
        success: false,
      };
    }
    const quizData = quizSnap.data();

    const questions = await getQuestions(quizId, user.uid);

    if (questions.length == 0) {
      console.log("No questions found for the quiz");

      return {
        success: false,
      };
    }

    const isCreator = quizData.creator === user.uid;
    const hasPassed =
      Array.isArray(quizData.usersIds) && quizData.usersIds.includes(user.uid);
    const sessionHasQuiz =
      session && session.quizId === quizId && task && task.isQuiz;

    console.log("isCreator:", isCreator);
    console.log("hasPassed:", hasPassed);
    console.log("sessionHasQuiz:", sessionHasQuiz);

    if (isCreator || hasPassed || sessionHasQuiz) {
      return {
        success: true,
        templateContext: {
          firstQuestion: questions[0],
          quizTitle: quizData.title,
          totalQuestions: questions.length,
        },
      };
    }

    return {
      success: false,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
    };
  }
};

const getQuizEditContext = async (quizId, userId) => {
  try {
    const ref = db.collection("quizzes").doc(quizId);
    const snap = await ref.get();
    const questions = await getQuestions(quizId);

    if (questions && snap.exists && snap.data().creator == userId) {
      const data = snap.data();
      return {
        success: true,
        templateContext: {
          title: data.title,
          subject: data.subject,
          questions: questions,
          sessionsCount: data.sessionsCount,
          groupsCount: data.groupsCount,
        },
      };
    } else {
      return {
        succeess: false,
        message: "unauthorized",
      };
    }
  } catch (error) {
    console.log(error, "error");
    return {
      success: false,
      message: "a message",
    };
  }
};

const getQuizzInfo = async (quizId, userId) => {
  try {
    const ref = db.collection("quizzes").doc(quizId);
    const snap = await ref.get();
    const quiz = snap.data();

    if (quiz && quiz.creator === userId) {
      const questions = await getQuestions(quizId, userId);
      /*success: true,
    quizData: {
      title: 'JavaScript Basics',
      subject: 'JavaScript',
      questions: [
        { */
      return {
        success: true,
        quizData: {
          title: quiz.title,
          subject: quiz.subject,
          questions: questions,
        },
      };
    } else {
      return {
        success: false,
        message: "Quiz not found or user does not have the right.",
      };
    }
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Cant fetch the quiz questions please try again late.r",
    };
  }
};

const getSessionQuizzes = async (
  userId,
  lastVisible = null,
  limit,
  searchTerm = "",
  oldQuizzes = []
) => {
  try {
    let accumulatedQuizzes = [...oldQuizzes];
    //have enough element to return
    if (accumulatedQuizzes.length >= limit) {
      return {
        cards: accumulatedQuizzes.slice(0, limit),
        lastVisible,
      };
    }

    let query = db.collection("quizzes").where("creator", "==", userId);
    //checking if the lastVisible is a doc or an id
    if (typeof lastVisible === "string" && lastVisible.trim() !== "") {
      const lastDocSnap = await db.collection("quizzes").doc(lastVisible).get();
      if (lastDocSnap.exists) {
        query = query.startAfter(lastDocSnap);
      }
    } else if (lastVisible) {
      query = query.startAfter(lastVisible);
    }

    const need = limit - accumulatedQuizzes.length;
    const batchSize = Math.max(need * 2, 20);
    query = query.limit(batchSize);

    const snapshot = await query.get();
    //checking if there is no item in bakend  and the quizzes array length is sphengea 0
    if (snapshot.empty && accumulatedQuizzes.length === 0) {
      return { cards: [], lastVisible: null };
    }

    const quizzes = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
      };
    });

    const filteredQuizzes =
      searchTerm.trim() != ""
        ? quizzes.filter((q) =>
            q.title.toLowerCase().includes(searchTerm.toLowerCase().trim())
          )
        : quizzes;

    accumulatedQuizzes = accumulatedQuizzes.concat(filteredQuizzes);

    const newLastVisible = snapshot.docs[snapshot.docs.length - 1];
    const isLastBatch = snapshot.docs.length < batchSize;
    const hasEnough = accumulatedQuizzes.length >= limit;
    //if we got enogh element we return them if we arrive to the end of the database elemnent we do return what we have
    if (hasEnough || isLastBatch) {
      return {
        cards: accumulatedQuizzes.slice(0, limit),
        lastVisible:
          isLastBatch || accumulatedQuizzes.length <= limit
            ? null
            : newLastVisible.id,
      };
    }
    //call back to the same function to try to get the limit
    return await getSessionQuizzes(
      userId,
      newLastVisible.id,
      limit,
      searchTerm,
      accumulatedQuizzes
    );
  } catch (error) {
    console.error("Error fetching quizzes:", error.message);
    return {
      cards: oldQuizzes,
      lastVisible: null,
    };
  }
};

const modifyQuizQuestions = async (
  updatedQuestions,
  newQuestions,
  deletedQuestions,
  quizzId,
  userId
) => {
  try {
    const quizzRef = db.collection("quizzes").doc(quizzId);
    const snaphsot = await quizzRef.get();
    const questionnsRef = db.collection("questions");
    const quizz = snaphsot.data();
    if (snaphsot.exists && quizz.creator === userId) {
      const operations = [];
      if (updatedQuestions.length > 0) {
        const updates = updatedQuestions.map((q) => {
          const ref = questionnsRef.doc(q.id);
          return ref.update({
            text: q.text,
            choices: q.choices,
            correctAnswerIndex: parseInt(q.correctAnswerIndex, 10),
          });
        });
        operations.push(...updates);
      }
      if (deletedQuestions.length > 0) {
        const suppression = deletedQuestions.map((q) => {
          return questionnsRef.doc(q).delete();
        });
        operations.push(...suppression);
      }
      if (newQuestions.length > 0) {
        const creation = newQuestions.map((q) => {
          return questionnsRef.doc(q.id).set({
            text: q.text,
            choices: q.choices,
            correctAnswerIndex: parseInt(q.correctAnswerIndex, 10),
            quizId: quizzId,
          });
        });
        operations.push(...creation);
      }

      await Promise.all(operations);

      const snap = await questionnsRef.where("quizId", "==", quizzId).get();
      const size = snap.size;
      quizzRef.update({
        questionsCount: size,
      });

      return {
        success: true,
        message: "Quiz updated successfully",
      };
    } else {
      return {
        success: false,
        message: `No quiz exist witht the id ${quizzId}`,
      };
    }
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Something happend while updating the quiz",
    };
  }
};

const getQuizResult = async (reqUserId, quizId, userId) => {
  
  const quizSnap = await db.collection("quizzes").doc(quizId).get();
  const quizCreator = quizSnap.data().creator;

  if (reqUserId === "self") {
    reqUserId = userId;
  }

  if (userId !== reqUserId && userId !== quizCreator)
    return {
      success: false,
      message: "You are not authorized to view this quiz result.",
    };

  const quizResultRef = db.collection("quizResults");
  try {
    const snapshot = await quizResultRef
      .where("userId", "==", reqUserId)
      .where("quizId", "==", quizId)
      .get();
    if (snapshot.empty) {
      return {
        success: false,
        message: "No quiz result found for this user and quiz",
      };
    }

    const questions = await getQuestions(quizId);
    const quizResult = snapshot.docs[0]?.data();
    return {
      success: true,
      quizResult,
      questions,
    };
  } catch (error) {
    console.error("Error fetching quiz result:", error);
    return {
      success: false,
      message: "Failed to fetch quiz result",
    };
  }
};

const addQuizResult = async (userId, quizResult) => {
  const quizResultRef = db.collection("quizResults");
  const existingResult = await quizResultRef
    .where("userId", "==", userId)
    .where("quizId", "==", quizResult.quizId)
    .get();

  const submittedCount =
    quizResult.correctAnswers.length + quizResult.incorrectAnswers.length;
  try {
    const newResult = {
      userId: userId,
      ...quizResult,
      submittedCount,
    };
    if (existingResult.empty) {
      await quizResultRef.add(newResult);
      // Add userId to usersIds array in the quizzes collection
      await db
        .collection("quizzes")
        .doc(quizResult.quizId)
        .update({
          usersIds: FieldValue.arrayUnion(userId),
        });
    } else {
      await quizResultRef.doc(existingResult.docs[0].id).update(newResult);
    }

    return {
      success: true,
      message: "Quiz result saved successfully",
    };
  } catch (error) {
    console.error("Error saving quiz result:", error);
    return {
      success: false,
      message: "Failed to save quiz result",
    };
  }
};

const getQuizResultsList = async (quizId, userId) => {
  try {
    const quizSnap = await db.collection("quizzes").doc(quizId).get();
    const quiz = quizSnap.data();

    if (!quizSnap.exists)
      return {
        success: false,
        message: "Quiz not found",
      };

    if (quiz.creator !== userId)
      return {
        success: false,
        message: "You are not authorized to view this quiz results.",
      };

    const quizResults = await db
      .collection("quizResults")
      .where("quizId", "==", quizId)
      .get();

    const results = await Promise.all(
      quizResults.docs.map((doc) => QuizResult.create(doc.data()))
    );

    return {
      success: true,
      results,
      quizTitle: quiz.title,
    };
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    return {
      success: false,
      message: "Failed to fetch quiz results",
    };
  }
};

//fucntion for updated question and questions
module.exports = {
  createExamen,
  getQuizResultsList,
  getSessionQuizzes,
  getQuizzInfo,
  createQuestion,
  updateQuizSubject,
  updateQuizTitle,
  getQuizzPlayContext,
  getQuizEditContext,
  supprimerExamen,
  getExams,
  modifyQuizQuestions,
  addQuizResult,
  getQuizResult,
};
