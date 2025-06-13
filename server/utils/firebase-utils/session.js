const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../../firebase/firebaseAdmin");
const { formatHoursMinutes } = require("../global");
const { is } = require("date-fns/locale");
const { messaging } = require("firebase-admin");

/**
 * {
   {
  name: 'first session ',
  description: 'iuytmlkojhghh',
  sessionQuiz: {
    quiz: {
      title: 'hzhz',
      durationInMins: 5,
      isQuiz: true,
      isBreak: false,
      description: 'lpoijuhygfds'
    },
    UID: 'aMw6hejAA1toscYKE2jB'
  },
  duration: 5,
  tasks: [
    {
      title: 'hzhz',
      durationInMins: 5,
      isQuiz: true,
      isBreak: false,
      description: 'lpoijuhygfds'
    }
  ]
}
        }
    ]
}
 */

const createGroupSession = async (sessionData, userId) => {
  try {
    if (!sessionData) {
      return {
        success: false,
        message: "no data is received",
      };
    }

    const {
      name,
      description,
      duration,
      tasks,
      groupId,
      sessionQuiz: { UID: quizId },
    } = sessionData;

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
        const taskPromises = tasks.map((task) => {
          const taskDocData = {
            title: task.title || "",
            durationInMins: task.durationInMins || 0,
            isBreak: task.isBreak || false,
            isQuiz: task.isQuiz || false,
            description: task.description || "",
            groupId: groupId || "",
            sessionId: newSessionId,
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

const annulerSession = async (sessionId, userId) => {
  try {
    const sessionRef = db.collection("sessions").doc(sessionId);
    const snapshot = await sessionRef.get();
    const usRef = db.collection("");
    const groupRef = db.collection("groups");
    const usersRef = db
      .collection("users")
      .where("currentSession", "==", sessionId);
    const snap = await usersRef.get();
    const session = snapshot.data();

    const isAdmin = session.creator === userId;

    if (!isAdmin) {
      const time = new Date(session.startDate).getTime() + duration * 1000 * 60;
      const timestamp = Date.now();

      if (timestamp > time) {
        await sessionRef.update({
          status: "finished",
        });
      } else {
        return {
          success: false,
          message: "You dont have the right to end the session.",
        };
      }
    }

    if (session && !snap.empty) {
      const promises = snap.docs.map((doc) => {
        const reference = usRef.doc(doc.id);
        return reference.update({
          currentSession: "",
          status: "aborted",
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
      return { success: true, message: "Session ended" };
    } else {
      return { success: false, message: "Cant end session" };
    }
  } catch (error) {
    console.log(error.message);
    return { success: false, message: "Somethign went wrong" };
  }
};

const leavSession = async (userID) => {
  const ref = db.collection("users").doc(userID);
  const doc = await ref.get();

  if (doc.exists) {
    await ref.update({
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
    console.log(userId);
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.warn(`User with ID ${userId} not found.`);
      return null;
    }

    const user = userSnap.data();

    if (!user || !user.currentSession || user.currentSession === "") {
      console.log(`User ${userId} does not have an active session.`);
      return null;
    }

    const sessionRef = db.collection("sessions").doc(user.currentSession);
    const sessionSnap = await sessionRef.get();

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
    const quiz = quizSnap && quizSnap.exists ? quizSnap.data() : null;

    const startDate = session.startDate;
    const endDateTimestamp =
      new Date(startDate).getTime() + session.duration * 60 * 1000;

    return {
      name: session.name,
      description: session.description,
      startDate: formatHoursMinutes(startDate),
      endDate: formatHoursMinutes(endDateTimestamp),
      duration: session.duration,
      groupName: group.name,
      joinedCount: session.userIds ? session.userIds.length : 0,
      isAdmin: group.creator === userId,
      quiz: quiz,
    };
  } catch (error) {
    console.error("Error getting current session info:", error);
    return null;
  }
};
/* const durationInMins = 120; // Example duration in minutes
  const startDate = '2025-06-10T21:23:54.096Z';
  const endDate = formatHoursMinutes(
    new Date(startDate).getTime() + durationInMins * 60 * 1000
  );

  return {
    name: "Session de révision - Janvier 2025",
    description: "Description de la session",
    startDate: formatHoursMinutes(startDate),
    endDate: endDate,
    duration: durationInMins,
    groupName: "Frontend Developers",
    joinedCount: 25,
    isAdmin: true,
    quiz: null,
  };
}; 



 {
      UID: '12345',
      name: 'Session de révision - Janvier 2025',
      groupName: 'Frontend Developers',
      description: 'Description de la session',
      startTime: formatHoursMinutes('2025-01-01T14:00:00Z'),
      endTime: formatHoursMinutes('2025-01-01T16:00:00Z'),
      duration: millisecondsToHMFormat(120 * 60 * 1000),
      joinedCount: 25,
      tasksCount: 14,
    },

*/

const getFetchActiveSessions = async (userId) => {
  try {
    const groupRef = db.collection("groups");
    const sessionRef = db.collection("sessions");
    const taskRef = db.collection("tasks");

    const userGroupsSnapshot = await groupRef
      .where("members", "array-contains", userId)
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
      console.log(
        `No active sessions found for user ${userId} in any joined groups.`
      );
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
      const endTime = startTime + session.duration * 60 * 1000;

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
    const tasks = await getTaches(sessionID); // Assumes this returns an array of Task/Quiz objects

    if (!snap.exists || tasks.length === 0) {
      return null;
    }

    const sessionData = snap.data();

    // Total duration
    const durationInMins = tasks.reduce(
      (acc, task) => acc + (task.durationInMins || 0),
      0
    );

    const startDate = new Date(sessionData.startTime || new Date());
    const endTime = new Date(startDate.getTime() + durationInMins * 60 * 1000);

    // Get first quiz task (if any)
    const quiz = tasks.find((task) => task.isQuiz);

    return {
      name: sessionData.name || "Session Name",
      description: sessionData.description || "",
      startTime: formatHoursMinutes(startDate),
      endTime: formatHoursMinutes(endTime),
      duration: millisecondsToHMFormat(durationInMins * 60 * 1000),
      groupName: sessionData.groupName || "No group",
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
    };
  } catch (error) {
    console.error("Failed to fetch session details:", error.message);
    return null;
  }
};

const getActiveSession = async (userId) => {
  try {
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    const taskRef = db.collection("tasks");


    if (!userSnap.exists) {
      console.warn(`User with ID ${userId} not found.`);
      return null;
    }


    const user = userSnap.data();
    const tasksSnap = await taskRef
      .where("sessionId", "==", user.currentSession)
      .get();
    const tasks = tasksSnap.docs.map((doc) => ({
    const tasksSnap = await taskRef
      .where("sessionId", "==", user.currentSession)
      .get();
    const tasks = tasksSnap.docs.map((doc) => ({
      UID: doc.id,
      ...doc.data(),
    }));

    /**
     * {
    title,
    description,
    durationInMins,
    isQuiz,
    isBreak,
    status,
    UID,
  }
     */

    if (!user || !user.currentSession || user.currentSession === "") {
      console.log(`User ${userId} does not have an active session.`);
      return null;
    }

    const sessionRef = db.collection("sessions").doc(user.currentSession);
    const sessionSnap = await sessionRef.get();

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
        quiz: quiz
          ? {
              ...quiz,
              UID: session.quizId || "",
              status: () => {
                const quizTask = tasks.find((task) => task.isQuiz);
                return quizTask.status;
              },
            }
          : null,
        tasks: tasks,
      },
    };
  } catch (error) {
    console.log("error");
  }
};

const joinSession = async (sessionId, userId) => {
  try {
    const ref = db.collection("sessions").doc(sessionId);
    const snap = await ref.get();
    const useref = db.collection("users").doc(userId);
    const usSnap = await useref.get();
    if (snap.exists && usSnap.exists) {
      await usSnap.update({
        currentSession: sessionId,
      });
      return {
        success: true,
        message: "You joined the session succcessfully",
      };
    }
  } catch (error) {
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
  annulerSession,
  getCurrentSessionInfo,
  getFetchActiveSessions,
  joinSession,
};
