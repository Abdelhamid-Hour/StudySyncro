const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../../firebase/firebaseAdmin");
const { formatHoursMinutes, millisecondsToHMFormat } = require("../global");
const { getQuizResult } = require("./examen");
const { getTasks } = require("./tache");

const createGroupSession = async (sessionData, userId) => {
  try {
    if (!sessionData) {
      return {
        success: false,
        message: "no data is received",
      };
    }

    const { name, description, duration, tasks, groupId } = sessionData;

    let quizId = "";

    if (sessionData.sessionQuiz && sessionData.sessionQuiz.UID) {
      quizId = sessionData.sessionQuiz.UID || "";
    }

    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();
    if (groupSnap.exists) {
      const groupData = groupSnap.data();
      if (groupData.creator !== userId) {
        return {
          success: false,
          message: "You are not the creator of this group",
        };
      }
    }

    const newSessionData = {
      name: name || "",
      description: description || "",
      duration: duration || 0,
      startDate: new Date().toISOString(),
      groupId: groupId || "",
      quizId: quizId || "",
      status: "active",
    };

    const sessionRef = db.collection("sessions");
    const docRef = await sessionRef.add(newSessionData);
    const newSessionId = docRef.id;

    const creator = db.collection("users").doc(userId);
    await creator.update({
      currentSession: newSessionId,
    });

    if (groupId) {
      await groupRef.update({
        currentSession: newSessionId,
      });

      if (tasks && tasks.length > 0) {
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
      }

      return {
        success: true,
        message: "Session created successfully",
      };
    }
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Cant create session",
    };
  }
};
const modifieSessionPropertie = async (newValue, propertie, session_id) => {
  try {
    const sessionRef = db.collection("sessions").doc(session_id);
    const snapshot = await sessionRef.get();
    const session = snapshot.data();
    if (session) {
      switch (propertie) {
        case "title":
          if (isNotEmpty) {
            ref.update({
              title: value,
            });
            return true;
          }
          break;

        case "description":
          if (isNotEmpty) {
            ref.update({
              description: value,
            });
            return true;
          }
          break;
        case "totalDuration":
          if (isNotEmpty) {
            ref.update({
              totalDuration: value,
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

const cancelSession = async (sessionId, userId) => {
  try {
    const sessionRef = db.collection("sessions").doc(sessionId);
    const snapshot = await sessionRef.get();
    const usRef = db.collection("users");
    const groupRef = db.collection("groups");
    const usersRef = usRef.where("currentSession", "==", sessionId);
    const snap = await usersRef.get();
    const session = snapshot.data();

    const isAdmin = session.creator === userId;

    if (!isAdmin) {
      const time = new Date(session.startDate).getTime() + duration * 1000 * 60;
      const timestamp = Date.now();

      if (timestamp >= time) {
        await sessionRef.update({
          status: "finished",
        });
        return { success: true, message: "Session ended" };
      } else {
        return {
          success: false,
          message: "You dont have the right to end the session.",
        };
      }
    }
    console.log("session is : ", session, "condition is : ", !snap.empty);

    if (session) {
      if (!snap.empty) {
        const promises = snap.docs.map((doc) => {
          const reference = usRef.doc(doc.id);
          sessionRef.update({
            status: "aborted",
          });
          return reference.update({
            currentSession: "",
          });
        });
        const gRefernce = groupRef.doc(session.groupId);
        const fetch = await gRefernce.get();

        if (fetch.exists) {
          promises.push(
            gRefernce.update({
              currentSession: "",
            })
          );
        }

        await Promise.all(promises);
      }

      return { success: true, message: "Session ended" };
    }
    return { success: false, message: "Cant end session" };
  } catch (error) {
    console.log(error.message);
    return { success: false, message: "Somethign went wrong" };
  }
};

const leavSession = async (userId) => {
  const userSnap = db.collection("users").doc(userId);
  const user = await userSnap.get();
  const sessionSnap = await db
    .collection("sessions")
    .doc(user.data().currentSession)
    .get();

  if (sessionSnap.exists) {
    await sessionSnap.ref.update({
      joinedUsers: FieldValue.arrayRemove(userId),
    });
  }

  if (user.exists) {
    await userSnap.update({
      currentSession: "",
    });
    return {
      success: true,
      message: "left the session ",
    };
  } else {
    return {
      success: false,
      message: "Cant leave session",
    };
  }
};

const getCurrentSessionInfo = async (userId) => {
  try {
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.warn(`User with ID ${userId} not found.`);
      return null;
    }

    const user = userSnap.data();

    if (!user || !user.currentSession || user.currentSession === "") {
      console.log("The user Not has any active session");
      return null;
    }

    const sessionRef = db.collection("sessions").doc(user.currentSession);
    const sessionSnap = await sessionRef.get();

    const quizTaskSnap = await db
      .collection("tasks")
      .where("sessionId", "==", user.currentSession)
      .where("isQuiz", "==", true)
      .get();

    if (!sessionSnap.exists) {
      console.warn(
        `Session with ID ${user.currentSession} not found for user ${userId}.`
      );
      return null;
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
        `Group with ID ${session.groupId} not found for session ${user.currentSession}.`
      );
      return null;
    }

    const group = groupSnap.data();

    let quizObj = null;
    if (session.quizId) {
      const result = await getQuizResult("self", session.quizId, userId);
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
            result.quizResult.correctAnswers.length / quizData.questionsCount
          ) * 100;
      }
    }

    const startDate = session.startDate;
    const endDateTimestamp =
      new Date(startDate).getTime() + session.duration * 60 * 1000;

    return {
      name: session.name,
      description: session.description,
      startDate: formatHoursMinutes(startDate),
      endDate: formatHoursMinutes(endDateTimestamp),
      duration: millisecondsToHMFormat(session.duration * 60 * 1000),
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

const getFetchActiveSessions = async (userId) => {
  try {
    const groupRef = db.collection("groups");
    const sessionRef = db.collection("sessions");
    const taskRef = db.collection("tasks");

    const userGroupsSnapshot = await groupRef
      .where("membersUids", "array-contains", userId)
      .get();

    if (userGroupsSnapshot.empty) {
      console.log(`User ${userId} is not a member of any groups.`);
      return [];
    }

    const groupNamesMap = new Map();
    userGroupsSnapshot.forEach((groupDoc) => {
      const groupData = groupDoc.data();
      groupNamesMap.set(groupDoc.id, groupData.name);
    });

    const sessionIdsToFetch = new Set();
    userGroupsSnapshot.forEach((groupDoc) => {
      const groupData = groupDoc.data();
      if (groupData.currentSession && groupData.currentSession !== "") {
        sessionIdsToFetch.add(groupData.currentSession);
      }
    });

    if (sessionIdsToFetch.size === 0) {
      return [];
    }

    const sessionIDsArray = Array.from(sessionIdsToFetch);

    const [sessionSnapshots, taskQuerySnapshots] = await Promise.all([
      Promise.all(
        sessionIDsArray.map((sessionId) => sessionRef.doc(sessionId).get())
      ),
      Promise.all(
        sessionIDsArray.map((sessionId) =>
          taskRef.where("sessionId", "==", sessionId).get()
        )
      ),
    ]);

    const activeSessionsData = sessionSnapshots
      .filter((sessionSnap) => sessionSnap.exists)
      .map((sessionSnap) => ({
        id: sessionSnap.id,
        ...sessionSnap.data(),
      }));

    const tasksBySessionId = new Map();
    taskQuerySnapshots.forEach((querySnap) => {
      querySnap.forEach((taskDoc) => {
        const taskData = taskDoc.data();
        if (taskData.sessionId) {
          if (!tasksBySessionId.has(taskData.sessionId)) {
            tasksBySessionId.set(taskData.sessionId, []);
          }
          tasksBySessionId
            .get(taskData.sessionId)
            .push({ id: taskDoc.id, ...taskData });
        }
      });
    });

    const formattedSessions = activeSessionsData.map((session) => {
      const startTime = session.startDate;
      const endTime =
        new Date(startTime).getTime() + session.duration * 60 * 1000;

      console.log("End TIme: ", endTime, "Start Time: ", startTime);

      const groupName = groupNamesMap.get(session.groupId) || "Unknown Group";
      const sessionTasks = tasksBySessionId.get(session.id) || [];

      return {
        UID: session.id,
        name: session.name || "",
        groupName: groupName,
        description: session.description || "",
        startTime: formatHoursMinutes(startTime),
        endTime: formatHoursMinutes(endTime),
        duration: millisecondsToHMFormat(session.duration * 60 * 1000),
        joinedCount: session.userIds ? session.userIds.length : 0,
        tasksCount: sessionTasks.length,
      };
    });

    return formattedSessions;
  } catch (error) {
    console.error("Error getting active sessions:", error);
    return [];
  }
};

const getSessionInformations = async (sessionID) => {
  try {
    const snap = await db.collection("sessions").doc(sessionID).get();
    const sessionData = snap.data();
    const tasks = await getTasks(sessionID); // Assumes this returns an array of Task/Quiz objects
    const groupSnap = await db
      .collection("groups")
      .doc(sessionData.groupId)
      .get();
    const groupName = groupSnap.exists ? groupSnap.data().name : "No group";

    if (!snap.exists || tasks.length === 0) {
      return {
        success: false,
        message: "Session not found or no tasks available",
      };
    }

    // Total duration
    const durationInMins = tasks.reduce(
      (acc, task) => acc + (task.durationInMins || 0),
      0
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
        duration: millisecondsToHMFormat(durationInMins * 60 * 1000),
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
      message: "Failed to fetch session details",
    };
  }
};

const isQuizPassed = async (userId, quizId) => {
  try {
    const quiz = await db.collection("quizzes").doc(quizId).get();
    const usersIds = quiz.data().usersIds || [];
    return usersIds.includes(userId);
  } catch (error) {
    console.error("Error checking if quiz is passed:", error);
    return false;
  }
};

const getActiveSession = async (userId) => {
  try {
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.warn(`User with ID ${userId} not found.`);
      return null;
    }

    const user = userSnap.data();

    const tasks = await getTasks(user.currentSession);

    if (!user || !user.currentSession || user.currentSession === "") {
      return {
        success: false,
        message: "User is not in a session",
      };
    }

    const sessionRef = db.collection("sessions").doc(user.currentSession);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      console.warn(
        `Session with ID ${user.currentSession} not found for user ${userId}.`
      );
      return {
        success: false,
        message: "Session not found",
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
        `Group with ID ${session.groupId} not found for session ${user.currentSession}.`
      );
      return {
        success: false,
        message: "Group not found",
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
      message: "Failed to fetch active session",
    };
  }
};

const joinSession = async (sessionId, userId) => {
  try {
    const ref = db.collection("sessions").doc(sessionId);
    const snap = await ref.get();
    const userRef = db.collection("users").doc(userId);
    const usSnap = await userRef.get();
    if (snap.exists && usSnap.exists) {
      ref.update({
        joinedUsers: FieldValue.arrayUnion(userId),
        joinedCount: FieldValue.increment(1),
      });
      await userRef.update({
        currentSession: sessionId,
      });
      return {
        success: true,
        message: "You joined the session succcessfully",
      };
    }
  } catch (error) {
    console.log(error);

    return {
      success: false,
      message: "Somethign wrong happened , please try again later",
    };
  }
};

module.exports = {
  leavSession,
  getActiveSession,
  modifieSessionPropertie,
  createGroupSession,
  cancelSession,
  getCurrentSessionInfo,
  getFetchActiveSessions,
  joinSession,
  isQuizPassed,
  getSessionInformations,
};
