
 const {FieldValue} = require("firebase-admin/firestore")
 const {db} = require('../firebase/firebaseAdmin')

 export const createSession = async(sessionData)=>{
    try {
        const sessionRef = db.collection("sesssions")
        const groupRef = db.collection("groups").doc(sessionData.groupId)
        if(sessionData){
           const docRef =  await sessionRef.add(sessionData)
            await groupRef.update({
                curentSession = docRef.id
            })
            return true 
        }
        else{
            return false 
        }
    } catch (error) {
        console.log(error)
        return false 
    }
 }


 export const modifieSessionPropertie  = async(newValue , propertie , session_id)=>{
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

 export const annulerSession  =async (sessionId)=>{
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

