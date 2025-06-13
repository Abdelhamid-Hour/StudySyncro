const { db } = require("../../firebase/firebaseAdmin");
const { getTaches } = require("./tache");
const { getAllGroups } = require("./group");
const { getQuestions, geQuiztDuration } = require("./question");

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
    console.log(
      "availableExams",
      availableExams,
      "limit",
      limit,
      "lastVisible",
      lastVisible
    );

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
        userIds: [],
      };
      const docRef = await examenRef.add(newExamen);
      console.log(docRef.id, "backend qui id");
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

// questions gestion

//Quesetion creation : Params (questionData)
// const getQuestions = async (examenId) => {
//   try {
//     const questionRef = db.collection('questions');
//     if (questionRef) {
//       const snapshot = await questionRef
//         .where('examenId', '==', examenId)
//         .get();
//       if (snapshot.empty) {
//         return [];
//       }
//       const questions = [];
//       snapshot.forEach((question) => {
//         questions.push({
//           id: question.id,
//           ...question.data(),
//         });
//       });
//       return questions;
//     }
//   } catch (error) {}
// };

const filtrerExamen = async (criteria, examens) => {
  console.log("examens", examens, "criteria", criteria);

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
//question remove : params(questionId)

const removeQuestion = async (questionId) => {
  try {
    const questionRef = db.collection("questions").doc(questionId);

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

// wach kayn examneId in current sessions , new field in groups , current session for the joined groups , is session active and sessio has the quiz id return , if is session Active and the quiz id in the current tache send play quiz

const getQuizzPlayContext = async (userId, quizId) => {
  try {
    console.log("params", { userId, quizId });
    const ref = db.collection("users").doc(userId);
    const snapshot = await ref.get();
    const user = snapshot.data();
    const sessionRf = db.collection("sessions");
    const sessions = await sessionRf.where("status", "==", "active").get();
    let session = user.currentSession
      ? await sessionRf.doc(user.currentSession).get()
      : null;
    const taskRef = user.currentSession
      ? db.collection("tasks").where("sessionId", "==", user.currentSession)
      : null;
    const task = taskRef ? taskRef.where("status", "==", "active").get() : {};
    const quizz = await db.collection("quizzes").doc(quizId).get();

    if (!quizz.exists) {
      return {
        success: false,
        message: "No quiz available.",
      };
    } else if (session && session.exists && session.quizId == quizId) {
      if (!task.isQuizz) {
        return {
          success: false,
          message: "Your current session does not have this quiz in tasks.",
        };
      }
    } else if (!sessions.empty) {
      sessions.forEach((doc) => {
        const data = doc.data();
        if (data.quizId === quizId) {
          return {
            succes: false,
            message: "Can't access this quiz.",
          };
        }
      });
    }

    const questions = await getQuestions(quizId, userId);
    if (questions.length == 0) {
      return {
        success: false,
        message: "No questions are available",
      };
    }
    return {
      success: true,
      templateContext: {
        firstQuestion: questions[0],
        quizTitle: quizz.title,
        totalQuestions: questions.length,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Something wrong happened while fetching the quiz data",
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
      console.log("else");
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

const modiferQuizQuestions = async (
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

      const snap = await  questionnsRef.where("quizId" , "=="  , quizzId).get()
      const size = snap.size()
      operations.push(quizzRef.update({
        questionsCount : size 
      }))
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
  getSessionQuizzes,
  getQuizzInfo,
  createQuestion,
  updateQuizSubject,
  updateQuizTitle,
  getQuizzPlayContext,
  getQuizEditContext,
  supprimerExamen,
  getExams,
  modiferQuizQuestions,
};
