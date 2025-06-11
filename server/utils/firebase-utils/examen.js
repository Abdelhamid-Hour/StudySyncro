const { db } = require("../../firebase/firebaseAdmin");
const { getTaches } = require("./tache");
const { getAllGroups } = require("./group");
// examen gestion *

const getFormatedQuizzs = (quizzes, user_id) =>
  quizzes.map(({ id , title , subject , questionsCount , sessionIdsCount , groupIdsCount, ...rest }) => ({
     id: id,
        title: title,
        questionsCount: questionsCount,
        sharedGroups: groupIdsCount,
        sharedSessions: sessionIdsCount,
        subject: subject,
  }));

const formatDate = (date) => {
  const formatted = new Date(date).toLocaleString(
    typeof Intl !== "undefined" &&
      Intl.DateTimeFormat().resolvedOptions().locale
      ? Intl.DateTimeFormat().resolvedOptions().locale
      : "fr-MA",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
  return formatted;
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
      const formattedExams = getFormatedQuizzs(
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
      const formattedExams = getFormattedExams(availableExams, userId);
      return { cards: formattedExams, lastVisible: null };
    }

    // Convert documents to quiz objects
    let exams = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply filter if provided
    const filteredExams = criteria
      ? await filtrerExamen(userId, criteria, exams, true)
      : exams;

    availableExams = availableExams.concat(filteredExams);

    const newLastVisible = snapshot.docs[snapshot.docs.length - 1];
    const isLastBatch = snapshot.docs.length < batchSize;
    const hasEnoughExams = availableExams.length >= limit;

    if (hasEnoughExams || isLastBatch) {
      const examsToReturn = availableExams.slice(0, limit);
      const formattedExams = getFormattedExams(examsToReturn, userId);

      const finalLastVisible =
        isLastBatch || availableExams.length <= limit
          ? null
          : newLastVisible.id;

      return { cards: formattedExams, lastVisible: finalLastVisible };
    }

    // Recursive call to get more exams
    return await getExams(userId, criteria, limit, newLastVisible.id, availableExams);
  } catch (error) {
    console.error(error.message, "error in getExams");
    return {
      cards: getFormattedExams(oldExams, userId),
      lastVisible,
    };
  }
};


const createExamen = async (examenData, userData) => {
  try {
    const examenRef = db.collection("Quizzes");
    const snaphsot = await examenRef
      .where("title", "==", examenData["quiz-title"])
      .where("creator", "==", userData.uid)
      .get();
    if (snaphsot.empty) {
      const newExamen = {
        title: examenData["quiz-title"],
        subject: examenData.subject,
        creator: userData.uid,
        sessionIdsCount: 0,
        groupIdsCount: 0,
        createdAt: new Date().toISOString(),
        questionsCount: 0,
        userIds: [],
      };
      const docRef = await examenRef.add(newExamen);
      console.log(docRef.id , 'backend qui id')
      const result = {
        success: true,
        quizId: docRef.id, // This should be replaced with actual logic to create a quiz
        message: "Quiz created successfully",
      };
      return result;
    } else {
      return {
        success: false,
        message: "a quizz already exist with the same title",
      };
    }
  } catch (error) {
    console.log(error.message);
    console.log("here");
    return {
      success: false,
      message: "error creating the quizz",
    };
  }
};

const supprimerExamen = async (examenId) => {
  try {
    const examenRef = db.collection("Quizzes").doc(examenId);
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

// questions gestion

//Quesetion creation : Params (questionData)
const getQuestions = async (examenId) => {
  try {
    const questionRef = db.collection("Questions");
    if (questionRef) {
      const snapshot = await questionRef
        .where("examenId", "==", examenId)
        .get();
      if (snapshot.empty) {
        return [];
      }
      const questions = [];
      snapshot.forEach((question) => {
        questions.push({
          id: question.id,
          ...question.data(),
        });
      });
      return questions;
    }
  } catch (error) {}
};

const filtrerExamen = async (criteria, examens) => {
  try {
    const quizzes = examens.filter((ex) => {
      let matchSearch = true;
      const searchTerm = criteria.searchTerm.trim().toLowerCase();
      if (criteria.searchBy === "subject") {
        matchSearch =
          searchTerm.trim() === "" ||
          ex.subject.toLowerCase().includes(searchTerm) ||
          ex.title.toLowerCase().includes(searchTerm);
      }

      return matchSearch;
    });
    const sortedExams = examens;

    if (criteria.sort === "desc" && examens.length >= 2) {
      sortedExams = examens.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
    } else if (criteria.sort === "asc" && examens.length >= 2) {
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
    const questionsRef = db.collection("Questions");
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
//question remove : params(questionId)

const removeQuestion = async (questionId) => {
  try {
    const questionRef = db.collection("Questions").doc(questionId);

    if (questionRef) {
      await questionRef.delete();
      return true;
    }
    return false;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const modifieQuiz = async (propertie, value, examenId) => {
  try {
    const ref = tacheRef.doc(examenId);
    const snaphsot = await ref.get();
    const examen = snaphsot.data();
    const isNotEmpty = value.trim() != "";
    if (examen) {
      await ref.update({
        propertie: value,
      });
      switch (propertie) {
        case "title":
          if (isNotEmpty) {
            ref.update({
              title: value,
            });
            return true;
          }
          break;

        case "subject":
          if (isNotEmpty) {
            ref.update({
              matiere: [...question.choix, value],
            });
            return true;
          }
          break;
        default:
          return false;
      }
    } else {
      return false;
    }
  } catch (error) {
    console.log(error.message);
    return false;
  }
};
const updateQuizTitle = async (title, id, userId) => {
  try {
    const ref = db.collection("Quizzes").doc(id);
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
    const ref = db.collection("Quizzes").doc(id);
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

// wach kayn examneId in current sessions , new field in groups , current session for the joined groups , is session active and sessio has the quiz id return , if is session Active and the quiz id in the current tache send play quiz

const getQuizzQuestion = async (sessionId, examId) => {
  const groups = await getAllGroups();
  const currentSessions = groups.map((group) => {
    return group.currentSession;
  });
  const activeSession = currentSessions.some(
    (session) => session === sessionId
  );
  if (activeSession) {
    const taches = await getTaches(sessionId);

    if (taches.length > 0) {
      taches.forEach((tache) => async () => {
        if (tache.isQuizz && tache.status != "active") {
          return;
        } else if (tache.isQuizz === examId && tache.status == "active") {
          const questions = await getQuestions(examId);
          if (questions.length > 0) {
            return questions;
          } else {
            return [];
          }
        }
      });
    }
  }
};
const modiferQuizQuestions = async (
  updatedQuestions,
  newQuestions,
  deletedQuestions,
  quizzId,
  userId
) => {
  try {
    const quizzRef = db.collection("Quizzes").doc(quizzId);
    const snaphsot = await quizzRef.get();
    const quizz = snaphsot.data();
    if (snaphsot.exists && quizz.creator === userId) {
      const operations = [];
      if (updatedQuestions.length > 0) {
        const updates = updatedQuestions.map((q) => {
          const ref = db.collection("Questions").doc(q.id);
          return ref.update({
            text: q.text,
            choices: q.choices,
            correctAnswerIndex: q.correctAnswerIndex,
          });
        });
        operations.push(...updates);
      }
      if (deletedQuestions.length > 0) {
        const suppression = deletedQuestions.map((q) => {
          const ref = db.collection("Questions").doc(q.id);
          return ref.delete();
        });
        operations.push(...suppression);
      }
      if (newQuestions.length > 0) {
        const creation = newQuestions.map((q) => {
          const ref = db.collection("Questions");
          return ref.doc(q.id).set({
            text: q.text,
            choices: q.choices,
            correctAnswerIndex: q.correctAnswerIndex,
          });
        });
        operations.push(...creation);
      }

      await Promise.all(operations);

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

//fucntion for updated question and questions
module.exports = {
  createExamen,
  createQuestion,
  updateQuizSubject,
  updateQuizTitle,
  supprimerExamen,
  getExams,
  modiferQuizQuestions,
};
