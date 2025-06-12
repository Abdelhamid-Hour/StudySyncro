const { joinGroup } = require('../utils/firebase-utils/demandes');
const { getExams } = require('../utils/firebase-utils/examen');
const {
  getJoinedGroups,
  getAvailableGroups,
  modifyGroup,
  createGroup,
} = require('../utils/firebase-utils/group');
const { getQuestions, geQuiztDuration } = require('../utils/firebase-utils/question');

const getUserGroupsHandler = async (req, res) => {
  const { lastVisible, count, level, visibility, searchTerm, sort, role } =
    req.query;
  console.log('Query Parameters:', req.query);

  const creteria = {
    level: level ? level.split(',') : [],
    visibility: visibility ? visibility.split(',') : [],
    searchTerm: searchTerm || '',
    sort: sort || 'desc',
    role: role ? role.split(',') : [],
  };

  const data = await getJoinedGroups(
    req.user.uid,
    creteria,
    parseInt(count, 10),
    lastVisible
  );

  return res.json(data);
};

const getAvailableGroupsHandler = async (req, res) => {
  const {
    lastVisible,
    count,
    level,
    visibility,
    searchTerm,
    sort,
    joinableOnly,
  } = req.query;
  const creteria = {
    level: level ? level.split(',') : [],
    visibility: visibility ? visibility.split(',') : [],
    searchTerm: searchTerm || '',
    sort: sort || 'desc',
    available: joinableOnly,
  };

  const data = await getAvailableGroups(
    req.user.uid,
    creteria,
    parseInt(count, 10),
    lastVisible
  );

  return res.json(data);
};

const getQuizzesHandler = async (req, res) => {
  const { searchTerm, sort, lastVisible, count } = req.query;
  const creteria = {
    searchTerm: searchTerm || '',
    sort: sort || 'desc',
  };
  const data = await getExams(req.user.uid, creteria, count, lastVisible);
  return res.json(data);
};

const groupFragmentHandler =
  ({ route, title }) =>
  (req, res) => {
    if (!res.payload.success)
      return res.status(400).json({
        message: res.payload.message || 'Failed to load.',
      });
    return res.render(
      `fragments/my-groups${route}`,
      {
        ...res.payload.context,
      },
      (err, template) => {
        if (err) {
          console.error('Error rendering template:', err);
          return res.status(500).json({
            message: 'Failed to load group info. Please try again later.',
          });
        }

        const response = { template, title };

        if (res.payload.context.count)
          response.count = res.payload.context.count;

        if (route === '/group-info')
          response.info = {
            ...res.payload.context,
          };

        res.json(response);
      }
    );
  };

const getQuizQuestionsHandler = async(req, res) => {
  const userid = req.user.uid;
  const quizId = req.query.quizId;

const questions = await getQuestions(quizId  , userid)
const duration = await geQuiztDuration(req.user , quizId)
  if (questions && duration) {
    return res.status(200).json({ questions , duration  });
  } 
  else {
    return res.status(400).json({
      message: result.message,
    });
  }
};





const createGroupHandler = async (req, res) => {
  const formData = req.body.groupData;
  const userData = req.user;
  const result = await createGroup(formData, userData);
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
};

const joinGroupHandler = async (req, res) => {
  console.log(req.body, 'req body for join group');
  const groupId = req.body.groupId;

  const result = await joinGroup(groupId, req.user);
  console.log(result, 'this is the result');
  if (result.success) {
    return res.status(200).json({ status: result.status });
  }
  return res.status(400).json({ message: result.message });
};

const patchGroupHandler = async (req, res) => {
  const updatedData = req.body.updatedData;

  const userData = req.user;
  console.log(updatedData, 'group data for update group');

  const result = await modifyGroup(
    userData.uid,
    req.params.groupId,
    updatedData
  );

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({
      message: result.message,
    });
  }
};

module.exports = {
  getUserGroupsHandler,
  getAvailableGroupsHandler,
  groupFragmentHandler,
  getQuizQuestionsHandler,
  getQuizzesHandler,
  patchGroupHandler,
  joinGroupHandler,
  createGroupHandler,
};
