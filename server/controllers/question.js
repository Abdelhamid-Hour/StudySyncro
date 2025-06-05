const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../firebase/firebaseAdmin");

const ajouterQuestion = async (question) => {
  try {

    const questionRef = db.collection("Question");
    await questionRef.add(question);
    return true;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const getQuestions = async (examenId) => {
  try {
    const questions = [];
    const questionRef = db.collection("Question");
    const snapshot = await questionRef.where("examenId","==",examenId).get(); 
    if (!snapshot.empty) {
      snapshot.forEach((doc) => {
      
          questions.push({ id: doc.id, ...doc.data() });
        
      });
          return questions;

    }
    else {
      return []
    }
    //return []
  } catch (error) {
   console.error(error.message)
   return false;
  }
};

const getChoices = async (examenId)=>{
  try {
    const questionRef = db.collection("Question").doc(examenId)
    const doc = await questionRef.get()
    if(doc.exists){
      const data = doc.data()
      const choices = data.choix
      return choices
    }
    else {
      return false
    }
  } catch (error) {
    console.log(error.message)
    return false
    
  }
}

const addChoice = async (choice  , questionId)=>{
        
    try {
        const questionRef  =  db.collection("Question").doc(questionId)
        const doc = await questionRef.get()  

        if (!doc.exists)  return false          ;
        
        const choices = doc.data().choix
        if(choices.includes(choice)) return false ;
        console.log(choices.includes(choice) , "include")
        await questionRef.update({
          choix : FieldValue.arrayUnion(choice)
        })        
        return true 
      
   }
    catch (error) {
        console.log(error.message)
        return false 
    }
 }

 const addCorrectChoice = async (choice  , questionId)=>{
        
    try {
        const questionRef  =  db.collection("Question").doc(questionId)
        await questionRef.update({
            reponse : choice
        })        
        return true 
    } catch (error) {
        console.log(error.message)
        return false 
    }
 }
//   const deleteCorrectChoice = async (questionId)=>{
        
//     try {
//         const questionRef  =  db.collection("Question").doc(questionId)
//         await questionRef.update({
//             reponse : ""//to remove 
//         })        
//         return true 
//     } catch (error) {
//         console.log(error.message)
//         return false 
//     }
//  }

 const deleteQuestion = async(questionId)=>{
   try {
       const questionRef  = db.collection("Question").doc(questionId)
       const doc =await  questionRef.get()
       if (doc.exists){
          await questionRef.delete()
          return true 
       }
       return false 
   } catch (error) {
      console.log(error.message)
      return false 
   }
 }

 const deleteChoice = async (choice, questionId)=>{

    try {
        const questionRef = db.collection("Question").doc(questionId)
        const doc = await questionRef.get()

        if(doc.exists){
            const answer = doc.data().reponse 
            if(choice === answer){
              await questionRef.update({
                choix : FieldValue.arrayRemove(choice)
            })
            const result = await deleteCorrectChoice(questionId)
            return result ? true  : false  
            }
            await questionRef.update({
                choix : FieldValue.arrayRemove(choice)
            })
            return true 
        

        }
        
        return false 
    } catch (error) {
        console.log(error.message)
        return false 
    }
 }

 const modifierQuestion= async(questionId , propertie , value)=>{
  try {
        const ref = tacheRef.doc(questionId)
        const snaphsot = await ref.get()
        const question = snaphsot.data()
        const isNotEmpty = value.trim() != ""
        if(question){
          await  ref.update({
                propertie : value
            })
            switch(propertie){
              case "text" : 
                if(isNotEmpty){  ref.update({
                    text : value
                  })
                  return true ;
                } break ;
              
                   case "choix" : 
                if(isNotEmpty){  ref.update({
                    choix : [...question.choix , value]
                  })
                  return true ;
                } break ;
                   case "reponse" : 
                if(isNotEmpty){  ref.update({
                    reponse : value
                  })
                  return true ;
                } break ;
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

 const getQuestionCountExam = async(examenId)=>{
  try {
    const ref = db.collection("questions")
    const snaphsot = await ref.get()

    if(snaphsot.empty){
      return 0 
    }
    else {
    return snaphsot.size()
    }
   
    
  } catch (error) {
    console.log(error)
    return false
  }
 }
module.exports = { ajouterQuestion , modifierQuestion , getQuestions , getChoices , deleteQuestion ,  deleteChoice,addCorrectChoice , addChoice};
