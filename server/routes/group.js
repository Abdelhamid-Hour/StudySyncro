const express = require('express');
const router = express.Router();

const {verifySessionCookieWithRedirect, verifySessionCookieWithoutRedirect} = require("../middleware/sessionVerification");

const {
    createGroup, 
    getGroupByID, 
    sendRequest, 
    modifyGroup, 
    deleteGroup, 
    acceptRequest, 
    rejectRequest, 
    quitterGroup, 
    ajouterMembre,
    getMembres, 
    kickMember,
    modifieGroupPropertie,
    getJoinedGroups,
    getAvailableGroups
} = require('../controllers/group');

/**
 * POST /createGroup
 * Creates a new group
 * Data in request body: formData object
 */
router.post('/createGroup', verifySessionCookieWithoutRedirect, async (req, res) => {
    const formData = req.body.formData;
    const userData = req.user;
    
    const result = await createGroup(formData, userData);
    if (result) {
        res.status(200).json({message: "Groupe créé avec succès"});
    } else {
        res.status(400).json({message: "Une erreur est survenue lors de la création du groupe"});
    }
});

/**
 * GET /AllGroups
 * Returns all groups
 * No parameters needed
 */
router.post("/joinedGroups", verifySessionCookieWithoutRedirect, async (req, res) => {
    const user_id  = req.user.uid
    const criteria = req.body.criteria 
    const limit = req.body.limit
    const lastDoc = req.body.lastDoc
    console.log(user_id , "user id")
    const result = await getJoinedGroups(user_id , criteria , limit , lastDoc);
    if (result){
        res.status(200).json({data : result,success : true});
    }else{
        res.status(200).json({success : false});
    }
});

router.post("/availableGroups" , verifySessionCookieWithRedirect , async(req , res)=>{
    const user_id  = req.user.uid
    const criteria = req.body.criteria 
    const limit = req.body.limit 
    const lastDoc = req.body.lastDoc
    console.log(user_id , "user id")
    const result = await getAvailableGroups(user_id , limit , lastDoc , criteria);
    if (result){
        res.status(200).json({data : result,success : true});
    }else{
        res.status(200).json({success : false});
    } 
})

/**
 * GET /getGroup/:groupId
 * Returns a specific group by ID
 * groupId in URL parameter
 */
router.get("/getGroup/:groupId", verifySessionCookieWithoutRedirect, async (req, res) => {
    const groupId = req.params.groupId;
    
    const group = await getGroupByID(groupId);
    if (group) {
        res.status(200).json({group: group});
    } else {
        res.status(400).json({message: "Groupe non trouvé"});
    }
});

/**
 * PUT /modifierGroup/:groupId
 * Modifies a group
 * groupId in URL parameter, formData in request body
 */
router.put("/modifierGroup/:groupId", verifySessionCookieWithoutRedirect, async (req, res) => {
    const groupId = req.params.groupId;
    const formData = req.body.formData;
    console.log(formData , "new form data")
    const result = await modifyGroup(groupId, formData);
    if (result) {
        res.status(200).json({message: "Groupe modifié avec succès"});
    } else {
        res.status(400).json({message: "Groupe non trouvé ou le nom est déjà pris"});
    }
});

router.put("/modifiePropertie/:groupId"  , verifySessionCookieWithRedirect , async(req , res)=>{
    try {
        const groupId = req.params.groupId 
        const newValue = req.body.newValue 
        const propertie = req.body.propertie 
        const result  = await modifieGroupPropertie(groupId , propertie , newValue)
        if(result){
            res.status(200).json({success : true , message : `${propertie} updated successfully`})
        }
        else {
            res.status(400).josn({succes : false , message : "cannot update the propertie"})
        }
    } catch (error) {
        res.status(500).json({succes : false , message : "an internal error "})
    }
})

/**
 * DELETE /quitterGroup/:groupId
 * User leaves a group
 * groupId in URL parameter
 */
router.delete("/quitterGroup/:groupId", verifySessionCookieWithoutRedirect, async (req, res) => {
   try {
     const groupId = req.params.groupId;
     const userId = req.user.uid;
     
     const result = await quitterGroup(groupId, userId);
     if (result) {
         res.status(200).json({message: "Vous avez quitté le groupe avec succès"});
     } else {
         res.status(400).json({message: "Groupe non trouvé ou vous n'êtes pas membre"});
     }
   } catch (error) {
    console.log(error.message)
    res.status(500).json({succes : false , message : "internal server error"})
   }
});

/**
 * DELETE /deleteGroup/:groupId
 * Deletes a group
 * groupId in URL parameter, csrfToken in request body
 */
router.delete("/deleteGroup/:groupId", verifySessionCookieWithoutRedirect, async (req, res) => {
    const groupId = req.params.groupId;
    
    const result = await deleteGroup(groupId);
    if (result) {
        res.status(200).json({message: "Groupe supprimé avec succès"});
    } else {
        res.status(400).json({message: "Groupe non trouvé"});
    }
});

/**
 * POST /ajouterMembre
 * Adds a member to a group
 * groupId and userId in request body
 */
router.post("/ajouterMembre", verifySessionCookieWithoutRedirect, async (req, res) => {
    try {
        const groupId = req.body.groupId;
        const userId = req.user.uid         
        // Ensure both groupId and userId are provided
        if (!groupId || !userId) {
            return res.status(400).json({message: "GroupId et userId sont requis"});
        }
        
        // Check if user is admin
     
            const result = await ajouterMembre(groupId, userId);
            if (result) {
                return res.status(200).json({message: "Membre ajouté avec succès"});
            } else {
                return res.status(400).json({message: "Utilisateur ou groupe non trouvé ou l'utilisateur est déjà membre"});
            }
      
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "le groupe est plein ou l'utilisateur n'existe pas"});
    }
});

/**
 * POST /sendRequest/:groupId
 * Sends a request to join a group
 * groupId in URL parameter
 */

/**
 * POST /acceptRequest
 * Accepts a request to join a group
 * groupId and demandeId in request body
 */
router.post("/acceptRequest", verifySessionCookieWithoutRedirect, async (req, res) => {
    const groupId = req.body.groupId;
    const requestId = req.body.demandeId;
    
    if (!groupId || !requestId) {
        return res.status(400).json({message: "GroupId et requestId sont requis"});
    }
    
    const result = await acceptRequest(groupId, requestId);
    if (result) {
        res.status(200).json({message: "Demande acceptée avec succès"});
    } else {
        res.status(400).json({message: "Demande non trouvée"});
    }
});

/**
 * DELETE /rejectRequest/:groupId/:requestId
 * Rejects a request to join a group
 * groupId and requestId in URL parameters
 */
router.delete("/rejectRequest/:groupId/:requestId", verifySessionCookieWithoutRedirect, async (req, res) => {
    const groupId = req.params.groupId;
    const requestId = req.params.requestId;
    
    const result = await rejectRequest(groupId, requestId);
    if (result) {
        res.status(200).json({message: "Demande rejetée avec succès"});
    } else {
        res.status(400).json({message: "Demande non trouvée"});
    }
});

/**
 * GET /currentUser
 * Returns the current user
 * No parameters needed
 */
router.get("/currentUser", verifySessionCookieWithoutRedirect, async (req, res) => {
    const user = req.user;
    if (user) {
        res.status(200).json({user: user});
    } else {
        res.status(400).json({message: "User non trouvé"});
    }
});


/**
 * GET /getMembres/:groupId
 * Returns the members of a group
 * groupId in URL parameter
 */

router.get("/getMembres/:groupId" , verifySessionCookieWithoutRedirect , async (req , res)=>{
   try {
    const groupId = req.params.groupId 
    const membres = await getMembres(groupId)
    if (membres){
        res.status(200).json({
            message : "membres fetched succesffuly" , 
            membres : membres 
        })
    }
    else{
        res.status(400).json({message : "can't fetch members"})
        
    }
   } catch (error) {
res.status(400).json({message : error.message})    
   }
})

router.delete("/kick/:groupId/:userId" ,   verifySessionCookieWithoutRedirect , async(req,res)=>{
    try {
        const groupId   = req.params.groupId 
        const userId = req.params.userId 
        const result = await kickMember(groupId , userId)
        if (result ){
            res.status(200).json({message : "user kicked from the group"})
        }
    } catch (error) {
        res.status(400).json({message : error.message})
    }
})


module.exports = router;