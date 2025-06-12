
 const {FieldValue} = require("firebase-admin/firestore")
 const {db} = require('../../firebase/firebaseAdmin')

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
      startDate: Date.now(),
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

 module.exports = {
    modifieSessionPropertie , 
    createSessions , 
    annulerSession
 }
