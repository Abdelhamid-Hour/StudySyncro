const { FieldValue, FieldPath } = require("firebase-admin/firestore");
const { db } = require("../../firebase/firebaseAdmin");
const {
  formatHoursMinutes,
  millisecondsToHMFormat,
  INITIALE_LOADERS_COUNT,
} = require("../global");
const {
  notifySessionStatus,
  updateSessionNotificationJoined,
} = require("./notifications");
const { getQuizResult, isQuizPassed } = require("./examen");
const { getTasks } = require("./tache");
const { syncUserGroupSnapshot } = require("./shared");

const createGroupSession = async (sessionData, userId) => {
  try {
    if (!sessionData) {
      return {
        success: false,
        message: "api:no_data_is_received",
        isNative: true,
        type: "warning",
      };
    }

    const { name, description, duration, tasks, groupId } = sessionData;

    if (!groupId)
      return {
        success: false,
        message: "api:group_id_is_required",
        isNative: true,
        type: "warning",
      };

    if (!tasks || tasks.length === 0)
      return {
        success: false,
        message: "api:at_least_one_task_is_required_to_create_a_session",
        isNative: true,
        type: "warning",
      };

    const calculatedTasksDuration = tasks.reduce(
      (sum, t) => sum + (Number(t.durationInMins) || 0),
      0,
    );
    console.log(duration, calculatedTasksDuration);

    if (duration !== calculatedTasksDuration) {
      return {
        success: false,
        message: "api:total_session_duration_does_not_match_the_sum_of_t",
        isNative: true,
        type: "warning",
      };
    }

    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();

    if (!groupSnap.exists) {
      return {
        success: false,
        message: "api:group_does_not_exist",
        isNative: true,
        type: "info",
      };
    }

    const groupData = groupSnap.data();

    if (groupData.creator !== userId)
      return {
        success: false,
        message: "api:you_are_not_the_creator_of_this_group",
        isNative: true,
        type: "warning",
      };

    let quizId = "";

    if (sessionData.sessionQuiz && sessionData.sessionQuiz.UID) {
      quizId = sessionData.sessionQuiz.UID || "";
      const quizRef = db.collection("quizzes").doc(quizId);
      const quizSnap = await db.collection("quizzes").doc(quizId).get();
      const existingQuizInGroup = await groupRef
        .collection("quizzesList")
        .doc(quizId)
        .get();

      if (!quizSnap.exists) {
        return {
          success: false,
          message: "api:quiz_does_not_exist",
          isNative: true,
          type: "info",
        };
      }

      if (!existingQuizInGroup.exists) {
        await groupRef.collection("quizzesList").doc(quizId).set({
          title: quizSnap.data().title,
          questionsCount: quizSnap.data().questionsCount,
          createdAt: FieldValue.serverTimestamp(),
          sessionName: name,
        });
        await quizRef.update({
          groupsCount: FieldValue.increment(1),
        });
      }

      await quizRef.update({
        sessionsCount: FieldValue.increment(1),
      });
    }

    const newSessionData = {
      name: name || "",
      description: description || "",
      duration: duration || 0,
      startDate: new Date().toISOString(),
      groupId: groupId || "",
      groupName: groupSnap.data().name || "",
      tasksCount: tasks.length || 0,
      joinedCount: 0,
      joinedUsers: [],
      quizId: quizId,
      status: "active",
      updatedAt: "",
    };

    const sessionRef = db.collection("sessions");
    const docRef = await sessionRef.add(newSessionData);
    const newSessionId = docRef.id;
    if (quizId) {
      const quizQuestionsSnap = await db
        .collection("quizzes")
        .doc(quizId)
        .collection("questions")
        .get();
      const batch = db.batch();
      quizQuestionsSnap.docs.forEach((question) => {
        const destRef = sessionRef
          .doc(newSessionId)
          .collection("quizQuestions")
          .doc(question.id);
        batch.set(destRef, question.data());
      });
      await batch.commit();
    }

    const creator = db.collection("users").doc(userId);
    await creator.update({
      currentSession: newSessionId,
    });

    await groupRef.update({
      currentSession: newSessionId,
    });

    const taskRef = db.collection("tasks");
    const taskPromises = tasks.map((task, index) => {
      const taskDocData = {
        title: task.title || "",
        durationInMins: task.durationInMins || 0,
        isBreak: task.isBreak || false,
        isQuiz: task.isQuiz || false,
        description: task.description || "",
        groupId: groupId || "",
        sessionId: newSessionId,
        index: index + 1,
        status: "pending",
      };
      return taskRef.add(taskDocData);
    });
    await Promise.all(taskPromises);

    // --- Active Sessions Fan-Out ---
    const membersSnap = await groupRef.collection("members").get();
    const fanoutBatches = [];
    let currentBatch = db.batch();
    let batchCount = 0;

    const activeSessionCardData = {
      name: newSessionData.name,
      description: newSessionData.description,
      startDate: newSessionData.startDate,
      groupName: newSessionData.groupName,
      tasksCount: newSessionData.tasksCount,
      joinedCount: 0,
      duration: newSessionData.duration,
    };

    membersSnap.docs.forEach((memberDoc) => {
      const activeSessionRef = db
        .collection("users")
        .doc(memberDoc.id)
        .collection("activeSessions")
        .doc(newSessionId);
      if (memberDoc.id === userId) {
        activeSessionCardData.isAdmin = true;
      } else {
        activeSessionCardData.isAdmin = false;
      }
      currentBatch.set(activeSessionRef, activeSessionCardData);
      batchCount++;
      if (batchCount === 500) {
        fanoutBatches.push(currentBatch.commit());
        currentBatch = db.batch();
        batchCount = 0;
      }
    });

    if (batchCount > 0) {
      fanoutBatches.push(currentBatch.commit());
    }
    await Promise.all(fanoutBatches);
    // -------------------------------

    const memberIds = membersSnap.docs.map((doc) => doc.id);
    await notifySessionStatus(
      groupId,
      newSessionData.groupName,
      newSessionData.name,
      newSessionId,
      true,
      memberIds,
      userId,
    );

    return {
      success: true,
      message: "api:session_created_successfully",
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "api:cant_create_session",
      isNative: false,
      type: "error",
    };
  }
};

const deleteActiveSessionFanOut = async (groupId, sessionId) => {
  try {
    const membersSnap = await db
      .collection("groups")
      .doc(groupId)
      .collection("members")
      .get();
    const fanoutBatches = [];
    let currentBatch = db.batch();
    let batchCount = 0;
    membersSnap.docs.forEach((memberDoc) => {
      const activeSessionRef = db
        .collection("users")
        .doc(memberDoc.id)
        .collection("activeSessions")
        .doc(sessionId);
      currentBatch.delete(activeSessionRef);
      batchCount++;
      if (batchCount === 500) {
        fanoutBatches.push(currentBatch.commit());
        currentBatch = db.batch();
        batchCount = 0;
      }
    });
    if (batchCount > 0) fanoutBatches.push(currentBatch.commit());
    await Promise.all(fanoutBatches);
  } catch (error) {
    console.error("Error fanning out active session deletion:", error);
  }
};

const updateActiveSessionFanOut = async (groupId, sessionId, data) => {
  try {
    const membersSnap = await db
      .collection("groups")
      .doc(groupId)
      .collection("members")
      .get();
    const fanoutBatches = [];
    let currentBatch = db.batch();
    let batchCount = 0;
    membersSnap.docs.forEach((memberDoc) => {
      const activeSessionRef = db
        .collection("users")
        .doc(memberDoc.id)
        .collection("activeSessions")
        .doc(sessionId);
      // We can only update if the document exists, set with merge is safer
      currentBatch.set(activeSessionRef, data, { merge: true });
      batchCount++;
      if (batchCount === 500) {
        fanoutBatches.push(currentBatch.commit());
        currentBatch = db.batch();
        batchCount = 0;
      }
    });
    if (batchCount > 0) fanoutBatches.push(currentBatch.commit());
    await Promise.all(fanoutBatches);
  } catch (error) {
    console.error("Error fanning out active session update:", error);
  }
};

const cancelSession = async (sessionId, userId) => {
  try {
    const sessionRef = db.collection("sessions").doc(sessionId);
    const snapshot = await sessionRef.get();

    if (!snapshot.exists) {
      return {
        success: false,
        message: "api:session_not_found",
        isNative: true,
        type: "info",
      };
    }

    const usRef = db.collection("users");
    const usersRef = usRef.where("currentSession", "==", sessionId);
    const snap = await usersRef.get();

    const groupRef = db.collection("groups");

    const session = snapshot.data();

    const isAdmin = session.creator === userId;

    if (!isAdmin) {
      const time =
        new Date(session.startDate).getTime() + session.duration * 1000 * 60;
      const timestamp = Date.now();

      if (timestamp >= time) {
        await sessionRef.update({
          status: "finished",
          updatedAt: FieldValue.serverTimestamp(),
        });
        await deleteActiveSessionFanOut(session.groupId, sessionId);
        const membersSnap = await db
          .collection("groups")
          .doc(session.groupId)
          .collection("members")
          .get();
        const memberIds = membersSnap.docs.map((doc) => doc.id);
        await notifySessionStatus(
          session.groupId,
          session.groupName,
          session.name,
          sessionId,
          false,
          memberIds,
        );
        return {
          success: true,
          message: "common:shared_texts.session_ended",
        };
      } else {
        return {
          success: false,
          message: "api:you_dont_have_the_right_to_end_the_session",
          isNative: true,
          type: "warning",
        };
      }
    }

    sessionRef.update({
      status: "aborted",
      updatedAt: FieldValue.serverTimestamp(),
    });

    let promises = [];

    if (!snap.empty) {
      promises = snap.docs.map((doc) => {
        const reference = usRef.doc(doc.id);
        return reference.update({
          currentSession: "",
        });
      });
    }

    const gRefernce = groupRef.doc(session.groupId);
    const gSnap = await gRefernce.get();

    if (gSnap.exists) {
      promises.push(
        gRefernce.update({
          currentSession: "",
        }),
      );
    }

    await Promise.all(promises);

    await deleteActiveSessionFanOut(session.groupId, sessionId);

    const membersSnap = await db
      .collection("groups")
      .doc(session.groupId)
      .collection("members")
      .get();
    const memberIds = membersSnap.docs.map((doc) => doc.id);
    await notifySessionStatus(
      session.groupId,
      session.groupName,
      session.name,
      sessionId,
      false,
      memberIds,
    );

    return { success: true, message: "common:shared_texts.session_ended" };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "api:somethign_went_wrong",
      isNative: false,
      type: "error",
    };
  }
};

const leavSession = async (userId) => {
  const userSnap = db.collection("users").doc(userId);

  const user = await userSnap.get();

  if (!user.data().currentSession) {
    return {
      success: false,
      message: "api:user_is_not_in_any_session",
      isNative: true,
      type: "info",
    };
  }

  const sessionSnap = await db
    .collection("sessions")
    .doc(user.data().currentSession)
    .get();

  if (sessionSnap.exists) {
    await sessionSnap.ref.update({
      joinedUsers: FieldValue.arrayRemove(userId),
      joinedCount: FieldValue.increment(-1),
    });
    // Fan out joinedCount decrement
    await updateActiveSessionFanOut(
      sessionSnap.data().groupId,
      user.data().currentSession,
      {
        joinedCount: FieldValue.increment(-1),
      },
    );
  }

  const leftSessionId = user.data().currentSession;
  await userSnap.update({
    currentSession: "",
  });
  if (leftSessionId) {
    await updateSessionNotificationJoined(userId, leftSessionId, false);
  }
  return {
    success: true,
    message: "api:you_left_the_session_succefully",
  };
};

const getCurrentSessionInfo = async (userId, t) => {
  try {
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.warn(`User with ID ${userId} not found.`);
      return null;
    }

    const user = userSnap.data();

    if (!user || !user.currentSession) {
      return null;
    }

    const sessionRef = db.collection("sessions").doc(user.currentSession);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      console.warn(
        `Session with ID ${user.currentSession} not found for user ${userId}.`,
      );
      return null;
    }

    const session = sessionSnap.data();

    if (session.status !== "active") {
      await userRef.update({
        currentSession: "",
      });
      return null;
    }

    const quizTaskSnap = await db
      .collection("tasks")
      .where("sessionId", "==", user.currentSession)
      .where("isQuiz", "==", true)
      .get();

    const [groupSnap, quizSnap] = await Promise.all([
      db.collection("groups").doc(session.groupId).get(),
      session.quizId
        ? db.collection("quizzes").doc(session.quizId).get()
        : Promise.resolve(null),
    ]);

    if (!groupSnap.exists) {
      console.warn(
        `Group with ID ${session.groupId} not found for session ${user.currentSession}.`,
      );
      return null;
    }

    const group = groupSnap.data();

    let quizObj = null;
    if (session.quizId) {
      const result = await getQuizResult(
        "self",
        session.quizId,
        session.groupId,
        userId,
      );
      const quizSubmittedCount = result.success
        ? result.quizResult.submittedCount
        : 0;

      const quizData = quizSnap && quizSnap.exists ? quizSnap.data() : null;
      quizObj = {
        ...quizData,
        status: quizTaskSnap?.docs[0]?.data().status || "pending",
      };

      if (result.success) {
        quizObj.passed = true;
        quizObj.submittedCount = quizSubmittedCount;
        quizObj.percentage =
          Math.round(
            result.quizResult.correctAnswers.length / quizData.questionsCount,
          ) * 100;
      }
    }

    const startDate = session.startDate;
    const endDateTimestamp =
      new Date(startDate).getTime() + session.duration * 60 * 1000;

    return {
      id: sessionSnap.id,
      name: session.name,
      description: session.description,
      startDate: formatHoursMinutes(startDate),
      endDate: formatHoursMinutes(endDateTimestamp),
      duration: millisecondsToHMFormat(session.duration * 60 * 1000, t),
      joinedCount: session.userIds ? session.userIds.length : 0,
      groupId: session.groupId,
      groupName: group.name,
      isAdmin: group.creator === userId,
      quiz: quizObj,
    };
  } catch (error) {
    console.error("Error getting current session info:", error);
    return null;
  }
};

const formatSessions = (sessions, t) => {
  return sessions.map((session) => {
    const startTime = session.data().startDate;
    const endTime =
      new Date(startTime).getTime() + session.data().duration * 60 * 1000;

    return {
      ...session.data(),
      id: session.id,
      startTime: formatHoursMinutes(startTime),
      endTime: formatHoursMinutes(endTime),
      duration: millisecondsToHMFormat(session.data().duration * 60 * 1000, t),
    };
  });
};

const fetchActiveSessions = async (
  userId,
  count = INITIALE_LOADERS_COUNT,
  lastVisible = null,
  criteria = {},
  t,
) => {
  try {
    const userRef = db.collection("users").doc(userId);
    let sessions = [];

    do {
      let query = userRef
        .collection("activeSessions")
        .orderBy(FieldPath.documentId(), "desc")
        .limit(count * 5); // fetch more to allow for client-side filtering

      if (lastVisible) {
        const lastVisibleDoc = await userRef
          .collection("activeSessions")
          .doc(lastVisible)
          .get();
        if (lastVisibleDoc.exists) {
          query = query.startAfter(lastVisibleDoc);
        } else {
          lastVisible = null;
          break;
        }
      }

      const sessionSnaps = await query.get();
      if (sessionSnaps.empty) {
        lastVisible = null;
        break;
      }

      let batchSessions = formatSessions(sessionSnaps.docs, t);

      if (criteria.search) {
        const searchTerm = criteria.search.trim().toLowerCase();
        batchSessions = batchSessions.filter(
          (s) =>
            (s.name && s.name.toLowerCase().includes(searchTerm)) ||
            (s.groupName && s.groupName.toLowerCase().includes(searchTerm)),
        );
      }

      sessions = sessions.concat(batchSessions).slice(0, count);

      lastVisible =
        sessionSnaps.docs.length === count * 5
          ? sessionSnaps.docs[sessionSnaps.docs.length - 1].id
          : null;
    } while (sessions.length < count && lastVisible);

    return { success: true, sessions, lastVisible };
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    return {
      success: false,
      isNative: false,
      message: "api:error_fetching_active_sessions",
      type: "error",
    };
  }
};

const getSessionInformations = async (sessionID, t) => {
  try {
    const snap = await db.collection("sessions").doc(sessionID).get();
    const sessionData = snap.data();
    const tasks = await getTasks(sessionID);
    const groupSnap = await db
      .collection("groups")
      .doc(sessionData.groupId)
      .get();
    const groupName = groupSnap.exists ? groupSnap.data().name : "No group";

    if (!snap.exists || tasks.length === 0) {
      return {
        success: false,
        message: "api:session_not_found_or_no_tasks_available",
        isNative: true,
        type: "info",
      };
    }

    // Total duration
    const durationInMins = tasks.reduce(
      (acc, task) => acc + (task.durationInMins || 0),
      0,
    );

    const startDate = new Date(sessionData.startDate);
    const endTime = new Date(startDate.getTime() + durationInMins * 60 * 1000);

    // Get first quiz task (if any)
    const quiz = tasks.find((task) => task.isQuiz);

    return {
      success: true,
      session: {
        id: sessionID,
        name: sessionData.name || "Session Name",
        description: sessionData.description || "",
        startTime: formatHoursMinutes(startDate),
        endTime: formatHoursMinutes(endTime),
        duration: millisecondsToHMFormat(durationInMins * 60 * 1000, t),
        groupName: groupName,
        joinedUsers: sessionData.joinedUsers || [],
        joinedCount: sessionData.joinedCount || 0,
        tasks,
        quiz: quiz
          ? {
              UID: quiz.UID || "",
              title: quiz.title,
              questionsCount: quiz.questionsCount || 0,
              status: "pending", // or derive from quiz if needed
            }
          : null,
      },
    };
  } catch (error) {
    console.error("Failed to fetch session details:", error.message);
    return {
      success: false,
      message: "api:failed_to_fetch_session_details",
      isNative: false,
      type: "error",
    };
  }
};

const getActiveSession = async (userId) => {
  try {
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();

    const user = userSnap.data();

    const tasks = await getTasks(user.currentSession);

    if (!user || !user.currentSession || user.currentSession === "") {
      return {
        success: false,
        message: "api:user_is_not_in_a_session",
        isNative: true,
        type: "info",
      };
    }

    const sessionRef = db.collection("sessions").doc(user.currentSession);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      console.warn(
        `Session with ID ${user.currentSession} not found for user ${userId}.`,
      );
      return {
        success: false,
        message: "api:session_not_found",
        isNative: true,
        type: "info",
      };
    }

    const session = sessionSnap.data();

    const [groupSnap, quizSnap] = await Promise.all([
      db.collection("groups").doc(session.groupId).get(),
      session.quizId
        ? db.collection("quizzes").doc(session.quizId).get()
        : Promise.resolve(null),
    ]);

    if (!groupSnap.exists) {
      console.warn(
        `Group with ID ${session.groupId} not found for session ${user.currentSession}.`,
      );
      return {
        success: false,
        message: "api:group_not_found",
        isNative: true,
        type: "info",
      };
    }

    const group = groupSnap.data();
    const creatorId = group.creator || "";

    const quiz = quizSnap && quizSnap.exists ? quizSnap.data() : null;

    const startDate = session.startDate;
    return {
      success: true,
      sessionData: {
        id: sessionSnap.id,
        name: session.name,
        startDate: startDate,
        durationInMins: session.duration,
        groupId: session.groupId,
        isAdmin: creatorId === userId,
        quiz: quiz
          ? {
              ...quiz,
              UID: session.quizId || "",
              status: tasks.find((task) => task.isQuiz)?.status,
              passed: await isQuizPassed(userId, session.quizId),
            }
          : null,
        tasks: tasks,
      },
    };
  } catch (error) {
    console.log("error", error);
    return {
      success: false,
      message: "api:failed_to_fetch_active_session",
      isNative: false,
      type: "error",
    };
  }
};

const joinSession = async (sessionId, userId) => {
  try {
    const ref = db.collection("sessions").doc(sessionId);
    const snap = await ref.get();
    const userRef = db.collection("users").doc(userId);
    const usSnap = await userRef.get();
    if (!snap.exists) {
      return {
        success: false,
        message: "api:session_not_found_1",
        isNative: true,
        type: "info",
      };
    }
    if (!usSnap.exists) {
      return {
        success: false,
        message: "api:user_not_found_1",
        isNative: true,
        type: "info",
      };
    }
    await ref.update({
      joinedUsers: FieldValue.arrayUnion(userId),
      joinedCount: FieldValue.increment(1),
    });
    await userRef.update({
      currentSession: sessionId,
    });

    // Fan out joinedCount increment
    await updateActiveSessionFanOut(snap.data().groupId, sessionId, {
      joinedCount: FieldValue.increment(1),
    });
    await updateSessionNotificationJoined(userId, sessionId, true);

    return {
      success: true,
      message: "api:you_joined_the_session_succcessfully",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "api:somethign_wrong_happened_please_try_again_later",
      isNative: false,
      type: "error",
    };
  }
};

module.exports = {
  leavSession,
  getActiveSession,
  createGroupSession,
  cancelSession,
  getCurrentSessionInfo,
  fetchActiveSessions,
  joinSession,
  getSessionInformations,
  fetchActiveSessions,
  formatSessions,
};
