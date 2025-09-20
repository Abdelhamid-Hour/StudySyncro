const express = require("express");
const router = express.Router();

const {
  verifySessionCookieWithRedirect,
  verifySessionCookieWithoutRedirect,
} = require("../middleware/sessionVerification");
const {
  createQuiz,
  supprimerExamen,
  getUserQuizzes,
} = require("../controllers/examen");

router.post(
  "/createExamen",
  verifySessionCookieWithoutRedirect,
  async (req, res) => {
    try {
      const examenData = req.body.examenData;
      const result = await createQuiz(examenData);
      switch (result) {
        case 1:
          res
            .status(200)
            .json({ message: "L'examen a été créer avec succès." });
          break;
        case 0:
          res
            .status(409)
            .json({ message: "Un examen existe déjà aved ce nom." });
          break;
        case 2:
          res
            .status(400)
            .json({
              message:
                "Une erreur est survenue l'hors de la création de l'examen.!",
            });
          break;
      }
    } catch (error) {
      console.log(error.message);
      res
        .status(400)
        .json({
          message:
            "Une erreur est survenue l'hors de la création de l'examen.!",
        });
    }
  }
);

router.post(
  "/removeExamen/:examenId",
  verifySessionCookieWithoutRedirect,
  async (req, res) => {
    try {
      const id = req.params.examenId;
      const result = supprimerExamen(id);
      if (result) {
        res.status(200).json({ message: "L'examen a été supprimer." });
      } else {
        res.status(400).json({ message: "L'opération a échouée" });
      }
    } catch (error) {
      console.log(error.message);
      res
        .status(400)
        .json({ message: "Une erreur a été survenue l'hors de l'opération.!" });
    }
  }
);

router.get(
  "/:groupId/Examens",
  verifySessionCookieWithoutRedirect,
  async (req, res) => {
    try {
      console.log(req.params.groupId);
      const id = req.params.groupId;
      const exams = await getUserQuizzes(id);
      console.log(exams, "here backend result");
      if (exams != false) {
        res
          .status(200)
          .json({ message: "examen collecter avec succes ", exams: exams });
      } else {
        res
          .status(400)
          .json({ message: "une erreur est servenu l'hors de l'opération" });
      }
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ message: "l'opération a echoué" });
    }
  }
);

module.exports = router;
