
const express = require('express');
const { verifySessionCookieWithoutRedirect } = require('../middleware/sessionVerification');
const {ajouterQuestion , getQuestions, getChoices, addChoice, deleteQustion, addCorrectChoice, deleteCorrectChoice, deleteChoice}  = require("../controllers/question");
const router = express.Router()



router.post("/ajouterQuestion" , verifySessionCookieWithoutRedirect, async(req ,res)=>{
    const questionData = req.body.questionData
    const result =  await ajouterQuestion(questionData) 
    if (result){
        res.status(200).json({message : "question ajouter avec succes"})
    }
    else {
            res.status(400).json({message : "operation echoue"})

    }
})
router.get("/:examenId/questions",verifySessionCookieWithoutRedirect , async(req,res)=>{
    try {
        const id = req.params.examenId
        console.log(id)
        const result =  await getQuestions(id)
        if (result){
            res.status(200).json({questions : result , message :"questions fetched successfully"})
        }
        else{
         res.status(400).json({message : "problem rendering"})

        }
    } catch (error) {
        console.error(error.message)
        res.status(500).json({message : "there is something wrong"})
    }
})

router.get("/:questionId/choices" , verifySessionCookieWithoutRedirect , async(req , res)=>{
    try {
        const questionId = req.params.questionId
        const result = await getChoices(questionId)
        if (result){
            res.status(200).json({choices : result})

        }
        else{
            res.status(400).json({message : `error fetching choices in question with the id ${questionId}`})
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).json({message : "error fetching choices catched in catch"})
    }
})
router.post("/addChoice" , verifySessionCookieWithoutRedirect , async(req , res)=>{
    try {
        const  choice = req.body.value
        const questionId = req.body.questionId
        const result = await  addChoice(choice, questionId)
        if (result){
            res.status(200).json({message : "choice added succesfully"})
        }
        else {
            res.status(400).json({message : `error adding the choice to the question with id ${questionId}`})
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).json({message : "error adding choice catched in catch"})
    }
})

router.delete("/:questionId/:choice/deleteChoice" , verifySessionCookieWithoutRedirect  , async(req ,res)=>{
    try {
        const questionId = req.params.questionId
        const choice = req.params.choice 
        const result = await deleteChoice(choice , questionId)
        if(result){
            res.status(200).json({message : `choice  "${choice}" deleted successfuly !!`})
        }
        else {
            res.status(400).json({message : `error deleting choice with value "${choice}" `})
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).json({message : "error deleting choice catched with catch"})        
    }
})

router.post("/addAnswer" , verifySessionCookieWithoutRedirect , async(req , res)=>{
    try {
        const answer = req.body.answer 
        const questionId = req.body.questionId 
        const result = await addCorrectChoice(answer , questionId)
        if(result){
            res.status(200).json({message : "correct answer added successfully"})
        }
        else {
            res.status(400).json({message :"error adding correct answer "})
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).json({message : "error adding correct answer catched by catch"})
        
    }
})

router.delete("/:questionId/correctAnswer/delete" , verifySessionCookieWithoutRedirect , async(req , res)=>{
    try {
        const  questionId = req.params.questionId
        const result  = await deleteCorrectChoice(questionId)
        if(result){
            res.status(200).json({message : "correct answer removed with success"})
        }
        else {
            res.status(400).json({message : "error removing correct answer"})
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).json({message : "error removing correct answer catched by catch"})
    }
})

router.delete("/:questionId/delete" , verifySessionCookieWithoutRedirect  , async(req , res)=>{
        try {
            const questionId = req.params.questionId
            const result = await deleteQustion(questionId)
            if(result){
                res.status(200).json({message : "question deleted successfully"})
            }
            else {
                res.status(400).json({message : "error deleting question"})
            }
        } catch (error) {
            console.log(error.message)
            res.status(500).json({message : "error deleting question catched with catch"})
        }
})

module.exports = router