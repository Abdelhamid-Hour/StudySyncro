const express = require('express');
const { verifySessionCookieWithoutRedirect } = require('../middleware/sessionVerification');
const { createGroupSession, modifieSessionPropertie, annulerSession } = require('../controllers/session');
const router = express.Router()



router.post("/createSession" , verifySessionCookieWithoutRedirect ,async (req ,res)=>{
        try {
            const sessionData = req.body.sessionData 
            const result = await createGroupSession(sessionData)
            if(result){
                res.status(200).json({success : true , message : "session created sucssessfully"})
            }
            else{
                res.status(400).json({success : false , message : "error creating session"})
            }
        } catch (error) {
            console.log(error.message)
            res.status(500).json({success : false , message : "itnernal server error"})        
        }
})

router.put(`/modifierSession/:sessionID` , verifySessionCookieWithoutRedirect  , async (req ,res)=>{
    try {
        const sessionId = req.params.sessionID
        const propertie = req.body.propertie 
        const newValue = req.body.newValue 
        const result = await modifieSessionPropertie(newValue , propertie , sessionId)
        if(result){
            res.status(200).json({success:true  , message : `${propertie} modified successfully`})
        }
        else {
            res.status(400).json({success : false , message : `error modifing ${propertie}`})
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).json({success : false , message: "internal server error"})
    }
})

router.delete("/deleteSession/:sessionId" , verifySessionCookieWithoutRedirect  , async (req , res)=>{
        try {
            const sessionId   = req.params.sessionId 
            const result  = await annulerSession(sessionId)
            if(result){
                res.status(200).json({success : true , message : "session deleted successfully"})
            }
            else{
                res.status(400).json({success : false , message : "error cannot delete session"})
            }
        } catch (error) {
            console.log(error.message)
            res.status(500).json({success : false , message  : "internal server error"})
        }
})

module.exports = router