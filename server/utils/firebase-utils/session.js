
 const {FieldValue} = require("firebase-admin/firestore")
 const {db} = require('../../firebase/firebaseAdmin');
const { formatHoursMinutes } = require("../global");



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

 const createSessions = async (sessionData) => {
  try {
    if (!sessionData) {
      return {
        success  : false , 
        message  : "no data is received"
      }
    }

    const {
      name,
      description,
      duration,
      groupId,
      quizId,
      tasks,
      userIds = []
    } = sessionData;

    const newSessionData = {
      name: name || "",
      description: description || "",
      duration: duration || 0,
      startDate: new Date.toIsoString(),
      groupId: groupId || "",
      quizId: quizId || "",
      status: "active",
      userIds: userIds,
    };

    const sessionRef = db.collection("sessions");
    const docRef = await sessionRef.add(newSessionData);
    const newSessionId = docRef.id;

    if (groupId) {
      const groupRef = db.collection("groups").doc(groupId);
      await groupRef.update({
        currentSession: newSessionId,
      });
    
    if (tasks && tasks.length > 0) {
      const taskRef = db.collection("tasks");
      const taskPromises = tasks.map((task) => {
        const taskDocData = {
          title: task.title || "",
          durationInMin: task.durationInMin || 0,
          isBreak: task.isBreak || false,
          isQuiz: task.isQuiz || false,
          description: task.description || "",
          groupId: groupId || "",
          sessionId: newSessionId,
          status : "pending"
        };
        return taskRef.add(taskDocData);
      });
       await Promise.all(taskPromises);
    }

    return {
        success : true , 
        message  : "Session created successfully"
    } 
    }
  } catch (error) {
    console.log(error)
   return {
    success : false , 
    message : "Cant create session"
   }
  }
};
  const modifieSessionPropertie  = async(newValue , propertie , session_id)=>{
    try {
        const sessionRef = db.collection("sessions").doc(session_id)
        const snapshot =  await sessionRef.get()
        const session = snapshot.data()
        if(session){
            switch(propertie){
              case "title" : 
                if(isNotEmpty){  ref.update({
                    title : value
                  })
                  return true ;
                } break ;
              
                   case "description" : 
                if(isNotEmpty){  ref.update({
                    description : value
                  })
                  return true ;
                } break ;
                   case "totalDuration" : 
                if(isNotEmpty){  ref.update({
                    totalDuration : value
                  })
                  return true ;
                } break ;
                default : return false ;
              
            }
           
        }
      
        else {
            return false 
        }
    } catch (error) {
        console.log(error.message)
        return false 
    }
 }

  const annulerSession  =async (sessionId)=>{
    try {
            const sessionRef = db.collection("sessions").doc(sessionId)
            const snapshot = await sessionRef.get()
            const session = snapshot.data()
            if(session){
                sessionRef.delete()
                return true 
            }
            else {
                return false 
            }
            
    } catch (error) {
        console.log(error.message)
        return false 
    }
 }


 const getCurrentSessionInfo = async (userId) => {
  try {
    console.log(userId)
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
      console.warn(`Session with ID ${user.currentSession} not found for user ${userId}.`);
      return null;
    }

    const session = sessionSnap.data();

    const [groupSnap, quizSnap] = await Promise.all([
      db.collection("groups").doc(session.groupId).get(),
      session.quizId ? db.collection("quizzes").doc(session.quizId).get() : Promise.resolve(null),
    ]);

    if (!groupSnap.exists) {
      console.warn(`Group with ID ${session.groupId} not found for session ${user.currentSession}.`);
      return null;
    }

    const group = groupSnap.data();
    const quiz = quizSnap && quizSnap.exists ? quizSnap.data() : null;

    const startDate = session.startDate;
    const endDateTimestamp = startDate + (session.duration * 60 * 1000);

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
}; */

 module.exports = {
    modifieSessionPropertie , 
    createSessions , 
    annulerSession , 
    getCurrentSessionInfo
 }
