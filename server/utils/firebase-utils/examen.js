const { FieldValue, FieldPath } = require("firebase-admin/firestore");
const { db, admin } = require("../../firebase/firebaseAdmin");
const { getQuestions, getQuizDuration } = require("./question");
const { toReadableDate } = require("../global");
const { getGroupById } = require("./shared");
const { INITIALE_LOADERS_COUNT } = require("../global");

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

const isQuizPassed = async (userId, quizId) => {
  try {
    const quizSnap = await db
      .collection("quizResults")
      .where("userId", "==", userId)
      .where("quizId", "==", quizId)
      .get();

    return !quizSnap.empty;
  } catch (error) {
    console.error("Error checking if quiz is passed:", error);
    throw error;
  }
};

const filterQuizzes = (criteria, quizzes) => {
  quizzes = quizzes.filter((ex) => {
    let matchSearch = true;
    let matchStatus =
      !criteria.status || criteria.status.length === 0
        ? true
        : criteria.status.some(
            (s) => s?.toLowerCase() === ex.status?.toLowerCase(),
          );
    let matchDate = criteria.date
      ? new Date(criteria.date) <= new Date(ex.submittedAt)
      : true;

    const searchTerm = criteria.searchTerm?.trim().toLowerCase() || "";
    if (searchTerm) {
      matchSearch =
        (ex.subject && ex.subject.toLowerCase().includes(searchTerm)) ||
        (ex.title && ex.title.toLowerCase().includes(searchTerm)) ||
        (ex.groupName && ex.groupName.toLowerCase().includes(searchTerm));
    }

    return matchSearch && matchDate && matchStatus;
  });

  return quizzes;
};

const getUserQuizzes = async (
  userId,
  criteria = {
    searchTerm: "",
    sort: "desc",
    status: [],
  },
  count = INITIALE_LOADERS_COUNT,
  lastVisible = null,
) => {
  try {
    let quizzes = [];

    do {
      let query = db
        .collection("quizzes")
        .where("creator", "==", userId)
        .orderBy("createdAt", criteria.sort || "desc")
        .limit(Number(count) * 10); // fetch more to cover filtering

      if (lastVisible) {
        const lastVisibleDoc = await db
          .collection("quizzes")
          .doc(lastVisible)
          .get();
        if (lastVisibleDoc.exists) {
          query = query.startAfter(lastVisibleDoc);
        } else {
          lastVisible = null;
          break;
        }
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        lastVisible = null;
        break;
      }

      const batchQuizzes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      quizzes = quizzes.concat(
        filterQuizzes(criteria, batchQuizzes).slice(0, count - quizzes.length),
      );

      lastVisible =
        snapshot.docs.length === Number(count) * 10
          ? snapshot.docs[snapshot.docs.length - 1].id
          : null;
    } while (quizzes.length < count && lastVisible !== null);

    lastVisible =
      quizzes.length === count ? quizzes[quizzes.length - 1].id : null;
    return {
      success: true,
      cards: quizzes,
      lastVisible,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error fetching user quizzes",
    };
  }
};

const getPassedQuizzes = async (
  userId,
  count = INITIALE_LOADERS_COUNT,
  lastVisible = null,
  criteria = {
    searchTerm: "",
    sort: "desc",
    date: "",
  },
) => {
  try {
    let quizzes = [];

    do {
      let query = db
        .collectionGroup("passedQuizzesRecords")
        .where("userId", "==", userId)
        .orderBy("submittedAt", criteria.sort || "desc")
        .limit(Number(count) * 10); // fetch more to cover filtering

      if (lastVisible) {
        const lastVisibleDoc = await db
          .collectionGroup("passedQuizzesRecords")
          .where(FieldPath.documentId(), "==", lastVisible)
          .get();
        if (!lastVisibleDoc.empty) {
          query = query.startAfter(lastVisibleDoc);
        } else {
          lastVisible = null;
          break;
        }
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        lastVisible = null;
        break;
      }

      const batchQuizzes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      quizzes = quizzes.concat(
        filterQuizzes(criteria, batchQuizzes).slice(0, count - quizzes.length),
      );

      lastVisible =
        snapshot.docs.length === Number(count) * 10
          ? snapshot.docs[snapshot.docs.length - 1].id
          : null;
    } while (quizzes.length < count && lastVisible !== null);

    lastVisible =
      quizzes.length === count ? quizzes[quizzes.length - 1].id : null;
    return {
      success: true,
      cards: quizzes,
      lastVisible,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error fetching user quizzes",
    };
  }
};

const getFilteredQuizzes = (criteria, quizzes, passedQuizzes, isAdmin) => {
  quizzes = quizzes.filter((doc) => {
    const title = doc.data().title?.toLowerCase() || "";
    const subject = doc.data().subject?.toLowerCase() || "";
    const searchTerm = criteria.search?.trim().toLowerCase() || "";
    const matchSearch = searchTerm
      ? title.includes(searchTerm) || subject.includes(searchTerm)
      : true;
    const submittedAt = passedQuizzes
      .find((quiz) => quiz.id === doc.id)
      ?.data().submittedAt;
    const matchDate = criteria.date
      ? submittedAt && new Date(submittedAt) >= new Date(criteria.date)
      : true;

    return matchSearch && matchDate;
  });
  return quizzes.map((doc) => {
    const resultInfo = passedQuizzes.find((quiz) => quiz.id === doc.id);
    const submittedAtString = resultInfo?.data().submittedAt;
    const submittedAt = submittedAtString
      ? toReadableDate(submittedAtString)
      : null;
    return {
      quizId: doc.id,
      title: doc.data().title,
      questionsCount:
        resultInfo?.data().questionsCount || doc.data().questionsCount,
      isAdmin,
      passed: Boolean(submittedAt),
      submittedAt,
      sessionName: doc.data().sessionName,
    };
  });
};

const getQuizzesByGroupId = async (
  groupId,
  userId,
  count = INITIALE_LOADERS_COUNT,
  lastVisible = null,
  criteria = {},
) => {
  try {
    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();

    if (!groupSnap.exists)
      return {
        success: false,
        message: "Group Not Found",
      };
    const passedQuizzesSnap = await db
      .collection("users")
      .doc(userId)
      .collection("passedQuizzes")
      .doc(groupId)
      .collection("passedQuizzesRecords")
      .get();

    const passedQuizzes = passedQuizzesSnap.docs;

    const group = await groupRef.get();

    const isAdmin = group.data().creator === userId;

    let quizzes = [];

    do {
      let query = groupRef
        .collection("quizzesList")
        .orderBy("createdAt", criteria.sort || "desc")
        .limit(Number(count) * 10);

      if (lastVisible) {
        const lastVisibleDoc = await groupRef
          .collection("quizzesList")
          .doc(lastVisible)
          .get();
        if (lastVisibleDoc.exists) {
          query = query.startAfter(lastVisibleDoc);
        } else {
          lastVisible = null;
          break;
        }
      }

      const quizzesSnap = await query.get();
      quizzes = quizzes.concat(
        getFilteredQuizzes(
          criteria,
          quizzesSnap.docs,
          passedQuizzes,
          isAdmin,
        ).slice(0, count - quizzes.length),
      );
      lastVisible =
        quizzesSnap.docs.length === Number(count) * 10
          ? quizzesSnap.docs[quizzesSnap.docs.length - 1].id
          : null;
    } while (quizzes.length < count && lastVisible !== null);

    lastVisible =
      quizzes.length === count ? quizzes[quizzes.length - 1].id : null;

    return {
      success: true,
      count: quizzes.length,
      cards: quizzes,
      lastVisible,
      isAdmin,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error fetching quizzes",
    };
  }
};

const createQuiz = async (examenData, userId) => {
  try {
    const titleAvailability = await isQuizTitleAvailable(
      examenData["quiz-title"],
      userId,
    );

    if (!titleAvailability.available) {
      return {
        success: false,
        message: titleAvailability.message,
      };
    }

    const examenRef = db.collection("quizzes");
    const newExamen = {
      title: examenData["quiz-title"],
      subject: examenData.subject,
      creator: userId,
      sessionsCount: 0,
      groupsCount: 0,
      createdAt: new Date().toISOString(),
      questionsCount: 0,
      status: "draft",
    };
    const docRef = await examenRef.add(newExamen);
    const result = {
      success: true,
      quizId: docRef.id, // This should be replaced with actual logic to create a quiz
      message: "Quiz created successfully",
    };
    return result;
  } catch (error) {
    console.log(error.message);
    return {
      success: false,
      message: "Error creating the quizz",
    };
  }
};

const isQuizTitleAvailable = async (title, userId, excludedQuizId = null) => {
  try {
    if (!title || !title.trim()) {
      return {
        success: false,
        available: false,
        message: "Quiz Title is required",
      };
    }

    const quizzesRef = db.collection("quizzes");
    const snapshot = await quizzesRef
      .where("title", "==", title)
      .where("creator", "==", userId)
      .get();

    const hasConflict = snapshot.docs.some((doc) => doc.id !== excludedQuizId);

    if (hasConflict) {
      return {
        success: true,
        available: false,
        message: "You already have a quiz with this title",
      };
    }

    return {
      success: true,
      available: true,
      message: "Quiz title is available",
    };
  } catch (error) {
    console.error("Error checking quiz title availability:", error);
    return {
      success: false,
      available: false,
      message: "Failed to check quiz title availability",
    };
  }
};

const deleteQuiz = async (quizId) => {
  try {
    const examenRef = db.collection("quizzes").doc(quizId);

    await examenRef.delete();

    return {
      success: true,
      message: "Quiz deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: "Error deleting the quiz",
    };
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
    console.error(error);
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
    console.error(error);
    return {
      success: false,
      message: "Could not update the quiz subject",
    };
  }
};

const getQuizzPlayContext = async (user, quizId, groupId) => {
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
    const groupSnap = groupId
      ? await db.collection("groups").doc(groupId).get()
      : null;
    const isTargetGroup =
      groupSnap &&
      groupSnap.exists &&
      groupSnap.data().currentSession === user.currentSession;

    if (!quizSnap) {
      return {
        success: false,
        message: "Error getting quiz data",
      };
    }

    const quizData = quizSnap.data();

    const result = await getQuizPlayDetails(user, quizId);

    if (!result.success) {
      return result;
    }

    const { duration, passed, questions } = result.data;

    if (questions.length === 0) {
      return {
        success: false,
        message: "No questions found in the quiz",
      };
    }

    const passedORCreator = passed;
    const sessionHasQuiz =
      session && session.quizId === quizId && task && task.isQuiz;

    if (passedORCreator || (sessionHasQuiz && isTargetGroup)) {
      return {
        success: true,
        templateContext: {
          firstQuestion: questions[0],
          quizTitle: quizData.title,
          totalQuestions: questions.length,
          questions: questions,
          duration,
          passed,
        },
      };
    }

    return {
      success: false,
      message: "Error getting quiz play context",
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error getting quiz play context",
    };
  }
};

const getQuizPlayDetails = async (user, quizId) => {
  try {
    const userId = user.uid;

    const questions = await getQuestions(quizId, userId);
    const passed =
      (await isQuizPassed(userId, quizId)) ||
      (await isAdminOfQuiz(userId, quizId));
    const duration = passed ? 0 : await getQuizDuration(user);

    return {
      success: true,
      data: {
        questions,
        duration,
        passed,
      },
    };
  } catch (error) {
    console.error("Error in getQuizPlayDetails:", error);
    return { success: false, message: "Internal Server Error" };
  }
};

const isAdminOfQuiz = async (userId, quizId) => {
  try {
    const quizSnap = await db.collection("quizzes").doc(quizId).get();
    return quizSnap.exists && quizSnap.data().creator === userId;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getQuizEditContext = async (quizId, userId) => {
  try {
    const quizRef = db.collection("quizzes").doc(quizId);
    const quizSnap = await quizRef.get();
    const questions = await getQuestions(quizId);

    if (!quizSnap.exists)
      return {
        success: false,
        statusCode: 404,
        message: "Quiz not found",
      };

    if (quizSnap.data().creator !== userId)
      return {
        success: false,
        statusCode: 401,
        message: "You are not authorized to edit this quiz",
      };

    const data = quizSnap.data();

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
  } catch (error) {
    console.error(error);
    return {
      success: false,
      statusCode: 500,
      message: "Cannot fetch data , please try again later !.",
    };
  }
};

const getQuizzInfo = async (quizId, userId) => {
  try {
    if (!quizId)
      return {
        success: false,
        message: "Quiz ID is required",
      };

    const quizRef = db.collection("quizzes").doc(quizId);
    const quizSnap = await quizRef.get();

    if (!quizSnap.exists)
      return {
        success: false,
        message: "Quiz not found",
      };

    const quiz = quizSnap.data();

    if (quiz.creator !== userId)
      return {
        success: false,
        message: "You are not authorized to edit this quiz",
      };

    const questions = await getQuestions(quizId, userId);
    return {
      success: true,
      quizData: {
        title: quiz.title,
        subject: quiz.subject,
        questions: questions,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Cant fetch the quiz questions please try again later",
    };
  }
};

const getSessionQuizzes = async (
  userId,
  lastVisible = null,
  limit = INITIALE_LOADERS_COUNT,
  searchTerm = "",
  oldQuizzes = [],
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

    let query = db
      .collection("quizzes")
      .where("creator", "==", userId)
      .where("status", "==", "published")
      .orderBy("createdAt", "desc");
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
            q.title.toLowerCase().includes(searchTerm.toLowerCase().trim()),
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
      accumulatedQuizzes,
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
  userId,
) => {
  try {
    const quizzRef = db.collection("quizzes").doc(quizzId);
    const quizSnap = await quizzRef.get();
    const questionsRef = quizzRef.collection("questions");
    const quizz = quizSnap.data();

    if (!quizSnap.exists) {
      return {
        success: false,
        message: "Quiz not found",
      };
    }

    if (quizz.creator !== userId) {
      return {
        success: false,
        message: "You are not authorized to modify this quiz",
      };
    }

    const operations = [];
    if (updatedQuestions.length > 0) {
      const updates = updatedQuestions.map((q) => {
        const ref = questionsRef.doc(q.id);
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
        return questionsRef.doc(q).delete();
      });
      operations.push(...suppression);
    }
    if (newQuestions.length > 0) {
      const creation = newQuestions.map((q) => {
        return questionsRef.doc(q.id).set({
          text: q.text,
          choices: q.choices,
          correctAnswerIndex: parseInt(q.correctAnswerIndex, 10),
        });
      });
      operations.push(...creation);
    }

    await Promise.all(operations);

    const snap = await questionsRef.count().get();
    const size = snap.data().count;

    quizzRef.update({
      questionsCount: size,
    });

    if (quizz.status === "draft" && size > 0) {
      await quizzRef.update({
        status: "published",
      });
    }

    return {
      success: true,
      message: "Quiz updated successfully",
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Something happend while updating the quiz",
    };
  }
};

const getQuizResult = async (reqUserId, quizId, groupId, userId) => {
  try {
    const quizSnap = await db.collection("quizzes").doc(quizId).get();
    const groupSnap = groupId
      ? await db.collection("groups").doc(groupId).get()
      : null;
    const quizCreator = quizSnap.data().creator;

    if (reqUserId === "self") {
      reqUserId = userId;
    }

    if (
      userId !== reqUserId &&
      (userId !== quizCreator ||
        (groupSnap && groupSnap.exists && groupSnap.data().creator !== userId))
    )
      return {
        success: false,
        message: "You are not authorized to view this quiz result.",
      };

    const quizResultRef = db.collection("quizResults");
    const quizResultSnap = await quizResultRef
      .where("userId", "==", reqUserId)
      .where("quizId", "==", quizId)
      .get();

    if (quizResultSnap.empty) {
      return {
        success: false,
        message: "No quiz result found for this user and quiz",
      };
    }

    const questionsSnap = await db
      .collection("sessions")
      .doc(quizResultSnap.docs[0].data().sessionId)
      .collection("quizQuestions")
      .get();

    const questions = questionsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text,
        choices: data.choices,
        correctAnswerIndex: data.correctAnswerIndex,
      };
    });

    const quizResult = quizResultSnap.docs[0]?.data();
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
  try {
    const userRef = db.collection("users").doc(userId);
    const userData = (await userRef.get()).data();
    const quizSnap = await db
      .collection("quizzes")
      .doc(quizResult.quizId)
      .get();

    if (!quizSnap.exists)
      return {
        success: false,
        message: "Quiz not found",
      };

    const quizTitle = quizSnap.data().title;

    const quizResultRef = db.collection("quizResults");
    const existingResult = await quizResultRef
      .where("userId", "==", userId)
      .where("quizId", "==", quizResult.quizId)
      .get();

    if (!userData.currentSession)
      return {
        success: false,
        message: "You are not in a session",
      };

    const sessionSnap = await db
      .collection("sessions")
      .doc(userData.currentSession)
      .get();

    if (!sessionSnap.exists)
      return {
        success: false,
        message: "Session not found",
      };

    const session = sessionSnap.data();

    if (!session.quizId || session.quizId != quizResult.quizId)
      return {
        success: false,
        message: "You are not in a session with this quiz",
      };

    const questionsCount = (
      await sessionSnap.ref.collection("quizQuestions").count().get()
    ).data().count;

    const submittedCount =
      quizResult.correctAnswers.length + quizResult.incorrectAnswers.length;
    const newResult = {
      userId,
      ...quizResult,
      submittedCount,
      sessionName: session.name,
      sessionId: userData.currentSession,
      groupId: session.groupId,
      quizTitle,
    };

    if (existingResult.empty) {
      await quizResultRef.add(newResult);
      const quizSnap = await db
        .collection("quizzes")
        .doc(quizResult.quizId)
        .get();
      const groupRes = await getGroupById(sessionSnap.data().groupId);
      const quiz = quizSnap.data();
      if (!groupRes.success) return groupRes;
      const group = groupRes.group;

      await userRef
        .collection("passedQuizzes")
        .doc(quizResult.groupId)
        .collection("passedQuizzesRecords")
        .doc(quizResult.quizId)
        .set({
          title: quiz.title,
          submittedAt: quizResult.submittedAt,
          groupName: group.name,
          score: Math.round(
            (quizResult.correctAnswers.length / questionsCount) * 100,
          ),
          questionsCount,
          userId,
          sessionName: session.name,
        });
    } else {
      return {
        success: true,
        message: "You have already submitted this quiz",
      };
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

const getQuizResultsByGroup = async (quizId, groupId, userId) => {
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
      .where("groupId", "==", groupId)
      .get();

    const results = await Promise.all(
      quizResults.docs.map((doc) => QuizResult.create(doc.data())),
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

const duplicateQuiz = async (quizId, userId, title) => {
  try {
    if (!quizId) {
      return {
        success: false,
        message: "Quiz ID is required",
      };
    }

    const quizRef = db.collection("quizzes");
    const quizSnap = await quizRef.doc(quizId).get();

    if (!quizSnap.exists)
      return {
        success: false,
        message: "Quiz not found",
      };

    const quiz = quizSnap.data();
    if (quiz.creator !== userId)
      return {
        success: false,
        message: "You are not authorized to duplicate this quiz.",
      };

    const newTitle = title || `${quiz.title} (Copy)`;
    const titleAvailability = await isQuizTitleAvailable(newTitle, userId);

    if (!titleAvailability.available) {
      return {
        success: false,
        message: titleAvailability.message,
      };
    }

    const newQuiz = {
      ...quiz,
      title: newTitle,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // add also the questions subcollection to the new quiz
    const questionsSnap = await quizRef
      .doc(quizId)
      .collection("questions")
      .get();
    const newQuizRef = await quizRef.add(newQuiz);
    const newQuestionsRef = newQuizRef.collection("questions");
    await Promise.all(
      questionsSnap.docs.map((doc) => {
        const questionData = doc.data();
        return newQuestionsRef.doc(doc.id).set(questionData);
      }),
    );

    return {
      success: true,
      message: "Quiz duplicated successfully",
      newQuizId: newQuizRef.id,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to duplicate quiz",
    };
  }
};
//fucntion for updated question and questions
module.exports = {
  createQuiz,
  isQuizTitleAvailable,
  getQuizPlayDetails,
  isAdminOfQuiz,
  duplicateQuiz,
  deleteQuiz,
  isQuizPassed,
  getQuizzesByGroupId,
  getQuizResultsByGroup,
  getSessionQuizzes,
  getQuizzInfo,
  updateQuizSubject,
  updateQuizTitle,
  getQuizzPlayContext,
  getQuizEditContext,
  getUserQuizzes,
  modifyQuizQuestions,
  getPassedQuizzes,
  addQuizResult,
  getQuizResult,
};
