
 const {FieldValue} = require("firebase-admin/firestore")
 const {db} = require('../../firebase/firebaseAdmin')
const { getTaches } = require("./tache")
const {getAllGroups} = require("./group")
 // examen gestion *

const getExams = async (groupId)=>{
    try {
        const examens = []
        const examenRef = db.collection("Examen")
        let query =  examenRef.where("groupId" , "==" , groupId)
        
             query = query.orderBy("creationDate" , "desc")
       
       
        const snapshot = await query.get()
        if (snapshot.empty){
            return []
        }
        snapshot.forEach(doc => {
            examens.push({id : doc.id , ...doc.data()})
        })
        return examens ;
        
    } catch (error) {
               console.log(error.message) 
        return false
    }
}


 const createExamen = async (examenData)=>{ 
    try {
        const examenRef = db.collection("Examen")
        const snaphsot = await examenRef
            .where("titre", "==", examenData.title)
            .where("groupId", "==", examenData.groupId)
            .get();     
        if (snaphsot.empty){
            const newExamen = {
                title : examenData.title,
                creator :examenData.creerPar ,
                sessionId :examenData.sessionId ,
                createdAt :examenData.dateCreation ,
                groupId : examenData.groupId,
                userIds : []

            }
            await examenRef.add(newExamen)
           console.log("examen créer avec succes")
            return 1   
      
    } 
    else {
        return 0 

    }
}
    catch (error) {
        console.log(error.message)
        return 2 
    }
 }

 const supprimerExamen = async (examenId)=>{
 try {
          const examenRef = db.collection("Examen").doc(examenId)
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

const modifieExamen =async(propertie , value , examenId)=>{
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
              
                   case "matiere" : 
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
const modifierQuestions =async (questions)=>{
    try {
        const updatedPromises = questions.map(async (question)=>{
            const {id , ...fields} = question
            const ref = db.collection("questions").doc(id)
            return ref.update(fields)
        })
        await Promise.all(updatedPromises)
        return true 
    } catch (error) {
        console.log(error)
        return false 
    }

}
//fucntion for updated question and questions 
 module.exports =  { createExamen , createQuestion  , removeQuestion , supprimerExamen , getExams}
 