
 const {FieldValue , where, getDocs, select } = require("firebase-admin/firestore")
 const {db} = require('../../firebase/firebaseAdmin')
const { getTaches } = require("./tache")
const {getAllGroups} = require("./group")
const {format , parseISO} = require("date-fns")
const { messaging } = require("firebase-admin")
 // examen gestion *

const formatDate = (date)=>{
    const formatted = format(parseISO(date), 'yyyy-MM-dd HH:mm');
    return formatted

}


const getExams = async (groupId , userId)=>{
    try {
  
        const quizzesList = []
        const sessionRef = db.collection("sessions")
        const quizzRef = db.collection("Examen")
        const groupRef = db.collection("groups").doc(groupId)
        const snapshot = await groupRef.get();        
        const group = snapshot.data()
        const listQ = group.quizList 

      if(snapshot.exists)
        {
          if(listQ.length === 0){
            return {
                count : 0,
                isAdmin : group.creator === userId , 
                quizzes : []
            }
        }
        else {
            listQ.foreach(async(snap)=>{
                const session = await sessionRef.doc(snap.sessionId).get()
                const quiz = await quizzRef.doc(snap.quizId).get()
                if(!quiz.exists && !session.exists){
                    
                }
                quizzesList.push({
                    quizId : quiz.id , 
                    quizTitle : quiz.title , 
                    sessionName : session.name ,
                    questionsCount : quiz.questionsCount ,
                    quizDate : formatDate(quiz.createdAt)
                })
            })

            return {
                count : quizzesList.length ,
                isAdmin : group.creator === userId ,
                quizzes : quizzesList
            }

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


 const createExamen = async (examenData , userData)=>{ 
    try {
        const examenRef = db.collection("Quizzes")
        const snaphsot = await examenRef
            .where("title", "==", examenData["quiz-title"])
            .where("creator", "==", userData.uid)
            .get();     
        if (snaphsot.empty){
            const newExamen = {
                title : examenData["quiz-title"],
                subject : examenData.subject ,
                creator : userData.uid ,
                sessionIdsCount : [] , 
                groupIdsCount : [] ,
                createdAt  : new Date().toISOString() ,
                questionsCount : 0 ,
                userIds : []

            }
          const id =  await examenRef.add(newExamen)
           const result = {
    success: true,
    quizId: id , // This should be replaced with actual logic to create a quiz
    message: "Quiz created successfully",
  };
            return result  
      
    } 
    else {
        return {
            success : false , 
            message : "a quizz already exist with the same title"
        }

    }
}
    catch (error) {
        console.log(error.message)
        console.log("here")
  return {
            success : false , 
            message : "error creating the quizz"
        }   
     }
 }

 const supprimerExamen = async (examenId)=>{
 try {
          const examenRef = db.collection("Quizzes").doc(examenId)
           if (examenRef){
                await examenRef.delete()
                return true 
        }   
        return false 
}
     catch (error) {
        console.log(error.message)
        return false 
    }
 }

 // questions gestion

 //Quesetion creation : Params (questionData)
 const getQuestions = async(examenId)=>{
    try {
        const questionRef = db.collection("Questions")
        if (questionRef){
            const snapshot = await questionRef.where("examenId","==", examenId).get() 
            if (snapshot.empty){
                return []
            }
            const questions=[]
            snapshot.forEach(question=>{
                    questions.push({
                       id : question.id ,  ...question.data()  
                    })
            })
            return questions                                                                                                                                                                      
        }
    } catch (error) {
        
    }
 }

const filtrerExamen = async ( criteria, examens) => {
  try {
    const examens =  examens.filter((ex) => {
        let matchSearch = true
      const searchTerm = criteria.searchTerm.trim().toLowerCase();
      if (criteria.searchBy === "subject") {
        matchSearch =
          searchTerm.trim() === "" || ex.subject.toLowerCase().includes(searchTerm) || ex.title.toLowerCase().includes(searchTerm);
      }

      return ( 
        matchSearch 
      );
    });
    const sortedExams = examens

    if(criteria.sort === "desc" && examens.length >=2){
        sortedExams = examens.sort((a , b)=>{
            const dateA = new Date(a.createdAt) 
            const dateB = new Date(b.createdAt)
            return  (dateB - dateA)
        })
    }
    else if(criteria.sort === "asc" && examens.length >= 2){
        sortedExams = examens.sort((a , b)=>{
             const dateA = new Date(a.createdAt) 
            const dateB = new Date(b.createdAt)
            return  (dateA - dateB)
        })
    }
    return sortedExams
  } catch (error) {
    console.log(error.message, "error here ");
    return false;
  }
};
 const createQuestion = async (questionData)=>{

    try {
        const questionsRef = db.collection("Questions")
        if (questionsRef)
        {const newQuestion = {
            text : questionData.text , 
            choix : questionData.choix , 
            reponse : questionData.reponse , 
            examenId : questionData.examenId

        }
        await setDoc(doc(db,"questions",id) , newQuestion)
        return true 
    }
    return false 
    } catch (error) {
        console.log(error.message)
        return false 
    }

 }
 //question remove : params(questionId)

const removeQuestion = async (questionId)=>{
    try {
        const questionRef = db.collection("Questions").doc(questionId)
        
        if (questionRef){
            await questionRef.delete()
            return true 
        }
        return false 
    } catch (error) {
        console.log(error.message)
        return false 
    }

}

const modifieQuiz =async(propertie , value , examenId)=>{
    try{
        const ref = tacheRef.doc(examenId)
        const snaphsot = await ref.get()
        const examen = snaphsot.data()
        const isNotEmpty = value.trim() != ""
        if(examen){
          await  ref.update({
                propertie : value
            })
            switch(propertie){
              case "title" : 
                if(isNotEmpty){  ref.update({
                    title : value
                  })
                  return true ;
                } break ;
              
                   case "subject" : 
                if(isNotEmpty){  ref.update({
                    matiere : [...question.choix , value]
                  })
                  return true ;
                } break 
                default : return false ;
              
            }
           
        }
        else{
            return false 
        }
    } catch (error) {
        console.log(error.message)
        return false 
    }
}
const updateQuizTitle =async (title , id , userId)=>{
    try {
        const ref = db.collection("Quizzes").doc(id)
        const snapShot = await ref.get()
        const quiz = snapShot.data()
        if(snapShot.exists && quiz.creator === userId){
            await ref.update({
                title : title 
            })
            return  {
            success: true,
            message: "Quiz title updated successfully",
  }
        }
        else {
            return  {
    success: false ,
    message: "Quiz id is not valid",
  };
        }
    } catch (error) {
        console.log(error)
        return {
            success : false  , 
            message : "Could not update  the quiz title"
        }
    }
}
const updateQuizSubject =async (subject , id , userId)=>{
    try {
        const ref = db.collection("Quizzes").doc(id)
        const snapShot = await ref.get()
        const quiz = snapShot.data()
        if(snapShot.exists && quiz.creator === userId){
            await ref.update({
                subject : subject 
            })
            return  {
            success: true,
            message: "Quiz subject updated successfully",
  }
        }
        else {
            return  {
    success: false ,
    message: "Quiz id is not valid",
  };
        }
    } catch (error) {
        console.log(error)
        return {
            success : false  , 
            message : "Could not update the quiz subject"
        }
    }
}

 // wach kayn examneId in current sessions , new field in groups , current session for the joined groups , is session active and sessio has the quiz id return , if is session Active and the quiz id in the current tache send play quiz  

 const getQuizzQuestion = async (sessionId , examId)=>{
    const groups = await getAllGroups()
    const currentSessions  = groups.map(group=>{
        return group.currentSession 
    })
    const activeSession  = currentSessions.some(session=>session === sessionId)
    if(activeSession){
            const taches = await getTaches(sessionId)

        if(taches.length > 0){
        taches.forEach(tache=>async()=>{
            if(tache.isQuizz && tache.status != "active"){
                return ;
            }
            else if(tache.isQuizz === examId && tache.status == "active"){
                const questions = await getQuestions(examId)
                if(questions.length > 0){
                    return questions
                }
                else {
                    return []
                }
            }
            
        })

    }
    }
    
 }
const modiferQuizQuestions =async (updatedQuestions , newQuestions , deletedQuestions , quizzId, userId)=>{
    try {
        const quizzRef = db.collection("Quizzes").doc(quizzId)
        const snaphsot = await quizzRef.get()
        const quizz = snaphsot.data()
        if(snaphsot.exists && quizz.creator === userId ){
            const operations = []
            if(updatedQuestions.length > 0){
                const updates = updatedQuestions.map((q)=>{
                    const ref = db.collection("Questions").doc(q.id)
                    return ref.update({
                        text : q.text , 
                        choices : q.choices , 
                        correctAnswerIndex : q.correctAnswerIndex 
                    }) 
                })
                operations.push(...updates)
            }
                if(deletedQuestions.length > 0){
                        const suppression = deletedQuestions.map((q)=>{
                        const ref = db.collection("Questions").doc(q.id)
                        return ref.delete()
                    })
                    operations.push(...suppression)
            }
            if(newQuestions.length > 0){
                const creation = newQuestions.map((q)=>{
                    const ref = db.collection("Questions")
                    return ref.doc(q.id).set({
                        text : q.text  , 
                        choices : q.choices , 
                        correctAnswerIndex : q.correctAnswerIndex 
                    })
                })
                operations.push(...creation)
            }
             

            await Promise.all(operations)

                 return  {
                success: true,
                message: "Quiz updated successfully",
             };


        }
        else {
               return  {
                success: false ,
                message: `No quiz exist witht the id ${quizzId}`,
             };

        }
    } catch (error) {
        console.log(error)
           return  {
                success: false ,
                message: "Something happend while updating the quiz",
             };

    }

}

//fucntion for updated question and questions 
 module.exports =  { createExamen , createQuestion, updateQuizSubject , updateQuizTitle   , supprimerExamen , getExams , modiferQuizQuestions}
 