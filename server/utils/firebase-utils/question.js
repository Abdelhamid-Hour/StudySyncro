const { FieldValue } = require('firebase-admin/firestore');
const { db } = require('../../firebase/firebaseAdmin');

const ajouterQuestion = async (question) => {
  try {
    const questionRef = db.collection('questions');
    await questionRef.add(question);
    return true;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const getQuestions = async (quizId) => {
  try {
    let questions = [];
    const questionRef = db.collection('questions');
    const snapshot = await questionRef.where('quizId', '==', quizId).get();

    if (!snapshot.empty) {
      questions = snapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          text: data.text,
          choices: data.choices,
          correctAnswerIndex: data.correctAnswerIndex,
        };
      });
      return questions;
    } else {
      return [];
    }
    //return []
  } catch (error) {
    console.error(error.message);
    return false;
  }
};

const getQuestionsPlayContext = async (userId, quizId) => {
  try {
    const ref = db.collection('sessions');
    const taskRef = db.collection('tasks');
    let duration = 0;
    let sessionId = '';
    const sessions = await ref.get();
    let timeLeft = 0;
    const questions = await getQuestions(quizId, userId);

    const tasks = await taskRef.where('sessionId', '==', sessionId).get();
    tasks.docs.forEach((doc) => {
      const data = doc.data();
      if (data.isQuiz && data.status === 'active') {
        duration = data.durationInMins;
      }
    });
    sessions.docs.forEach((doc) => {
      const data = doc.data();
      if (data.quizId == quizId) {
        sessionId = data.id;
        const currentTime = new Date.now();
        const timeDiff = currentTime - new Date(data.startDate);
        if (timeDiff < data.duration) {
          timeLeft = Math.floor(timeDiff / 60000);
        }
      }
    });
  } catch (error) {
    console.log(error);
  }
};

// const getQuestionsForPlay = async (userId , quizId)=>{
//   try {
//     const questions = await getQuestions(quizId , userId)

//   } catch (error) {
//     console.error(error.message);
//     return false;
//   }
// }

const getChoices = async (examenId) => {
  try {
    const questionRef = db.collection('questions').doc(examenId);
    const doc = await questionRef.get();
    if (doc.exists) {
      const data = doc.data();
      const choices = data.choix;
      return choices;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const geQuiztDuration = async (user, quizId) => {
  try {
    let duration = 0;
    const sessionRf = db.collection('sessions');
    const session = await sessionRf.doc(user.currentSession).get();
    const taskRef = db
      .collection('tasks')
      .where('sessionId', '==', user.currentSession)
      .where('state', '==', 'active');
    const task = await taskRef.get();
    const timeLeft = Date.now() - new Date(session.startDate).getTime();
    if (!task.empty && task.isQuiz && session.exists) {
      if (timeLeft < session.duration) {
        const timeDiff = Math.floor(session.duration - timeLeft * 60000);
        const pendingTasks = await taskRef
          .where('status', '==', 'pending')
          .get();
        const totalduration = pendingTasks.docs.reduce((accumulated, doc) => {
          const data = doc.data();
          accumulated += data.duration;
          return accumulated;
        }, 0);
        duration = timeDiff - totalduration;
      }
    } else {
      duration = null;
    }
    return duration;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const addChoice = async (choice, questionId) => {
  try {
    const questionRef = db.collection('questions').doc(questionId);
    const doc = await questionRef.get();

    if (!doc.exists) return false;

    const choices = doc.data().choix;
    if (choices.includes(choice)) return false;
    await questionRef.update({
      choix: FieldValue.arrayUnion(choice),
    });
    return true;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const addCorrectChoice = async (choice, questionId) => {
  try {
    const questionRef = db.collection('questions').doc(questionId);
    await questionRef.update({
      reponse: choice,
    });
    return true;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const deleteQuestion = async (questionId) => {
  try {
    const questionRef = db.collection('questions').doc(questionId);
    const doc = await questionRef.get();

    if (doc.exists) {
      const data = doc.data()
      const quizId  = data.quizId 
      
      const quizRef = db.collection("quizzes").doc(quizId)

      const promises = []
      promises.push( questionRef.delete())

      return true;
    }
    return false;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const deleteChoice = async (choice, questionId) => {
  try {
    const questionRef = db.collection('questions').doc(questionId);
    const doc = await questionRef.get();

    if (doc.exists) {
      const answer = doc.data().reponse;
      if (choice === answer) {
        await questionRef.update({
          choix: FieldValue.arrayRemove(choice),
        });
        const result = await deleteCorrectChoice(questionId);
        return result ? true : false;
      }
      await questionRef.update({
        choix: FieldValue.arrayRemove(choice),
      });
      return true;
    }

    return false;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const modifierQuestion = async (questionId, propertie, value) => {
  try {
    const ref = tacheRef.doc(questionId);
    const snaphsot = await ref.get();
    const question = snaphsot.data();
    const isNotEmpty = value.trim() != '';
    if (question) {
      await ref.update({
        propertie: value,
      });
      switch (propertie) {
        case 'text':
          if (isNotEmpty) {
            ref.update({
              text: value,
            });
            return true;
          }
          break;

        case 'choix':
          if (isNotEmpty) {
            ref.update({
              choix: [...question.choix, value],
            });
            return true;
          }
          break;
        case 'reponse':
          if (isNotEmpty) {
            ref.update({
              reponse: value,
            });
            return true;
          }
          break;
        default:
          return false;
      }
    } else {
      return false;
    }
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

const getQuestionCountExam = async (examenId) => {
  try {
    const ref = db.collection('questions').where('QuizId', '==', examenId);
    const snaphsot = await ref.get();

    if (snaphsot.empty) {
      return 0;
    } else {
      return snaphsot.size();
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};
module.exports = {
  ajouterQuestion,
  modifierQuestion,
  getQuestions,
  getChoices,
  deleteQuestion,
  deleteChoice,
  addCorrectChoice,
  addChoice,
  geQuiztDuration,
  getQuestionsPlayContext,
};
