const { getDemandesByGroupId } = require("../utils/firebase-utils/demandes");
const {
  getUserQuizzes,
  isAdminOfQuiz,
  isQuizPassed,
  getQuizzesByGroupId,
  deleteQuiz,
  getPassedQuizzes,
} = require("../utils/firebase-utils/examen");
const {
  getJoinedGroups,
  getAvailableGroups,
  modifyGroup,
  createGroup,
  joinGroup,
  deleteGroup,
  leaveGroup,
  inviteMembers,
  updateGroupProperty,
} = require("../utils/firebase-utils/group");
const {
  kickMember,
  getUsers,
  getMembers,
} = require("../utils/firebase-utils/members");
const {
  getQuestions,
  getQuizDuration,
} = require("../utils/firebase-utils/question");

const getUserGroupsHandler = async (req, res) => {
  const { lastVisible, count, level, visibility, searchTerm, sort, role } =
    req.query;

  const creteria = {
    level: level ? level.split(",") : [],
    visibility: visibility ? visibility.split(",") : [],
    searchTerm: searchTerm || "",
    sort: sort || "desc",
    role: role ? role.split(",") : [],
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
    level: level ? level.split(",") : [],
    visibility: visibility ? visibility.split(",") : [],
    searchTerm: searchTerm || "",
    sort: sort || "desc",
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
  const { searchTerm, sort, lastVisible, count, status } = req.query;
  const creteria = {
    searchTerm: searchTerm || "",
    sort: sort || "desc",
    status: status ? status.toLowerCase().split(",") : [],
  };
  const result = await getUserQuizzes(
    req.user.uid,
    creteria,
    count,
    lastVisible
  );

  if (result.success) {
    return res
      .status(200)
      .json({ cards: result.cards, lastVisible: result.lastVisible });
  }

  return res.status(400).json({ message: result.message });
};

const groupFragmentHandler =
  ({ route, title }) =>
  (req, res) => {
    if (!res.payload.success)
      return res.status(400).json({
        message: res.payload.message || "Failed to load.",
      });
    return res.render(
      `fragments/my-groups${route}`,
      {
        ...res.payload.context,
      },
      (err, template) => {
        if (err) {
          console.error("Error rendering template:", err);
          return res.status(500).json({
            message: "Failed to load group info. Please try again later.",
          });
        }

        const response = { template, title };

        if (res.payload.context.count !== undefined)
          response.count = res.payload.context.count;

        if (route === "/group-info")
          response.info = {
            ...res.payload.context,
          };

        res.json(response);
      }
    );
  };

const getQuizPlayDetailsHandler = async (req, res) => {
  try {
    const userId = req.user.uid;
    const quizId = req.params.quizId;

    const questions = await getQuestions(quizId, userId);
    const passed =
      (await isQuizPassed(userId, quizId)) ||
      (await isAdminOfQuiz(userId, quizId));
    const duration = passed ? null : await getQuizDuration(req.user);
    return res.status(200).json({ questions, duration, passed });
  } catch (error) {
    console.error("Error in getQuizPlayDetailsHandler:", error);
    return res.status(500).json({ message: "Internal Server Error" });
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
  const groupId = req.body.groupId;

  const result = await joinGroup(groupId, req.user);
  if (result.success) {
    return res.status(200).json({ status: result.status });
  }
  return res.status(400).json({ message: result.message });
};

const patchGroupHandler = async (req, res) => {
  const updatedData = req.body.updatedData;

  const userData = req.user;
  console.log(updatedData, "group data for update group");

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

const transferRoleHandler = async (req, res) => {
  const { groupId, memberId } = req.body;
  const result = await updateGroupProperty(groupId, "creator", memberId);
  // TODO: Implement transferRole logic

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
};

const kickMemberHandler = async (req, res) => {
  const { groupId, memberId } = req.body;
  const result = await kickMember(groupId, memberId);
  // TODO: Implement kickMember logic

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
};

const leaveGroupHandler = async (req, res) => {
  const { groupId } = req.body;
  const result = await leaveGroup(groupId, req.user.uid);

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
};

const removeGroupHandler = async (req, res) => {
  const { groupId } = req.params;
  const result = await deleteGroup(groupId);
  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
};

const getUsersHandler = async (req, res) => {
  try {
    const { search, count, lastVisible, groupId } = req.query;
    const result = await getUsers(search, count, lastVisible, groupId);

    if (result.success) {
      res.json({ cards: result.users, lastVisible: result.lastVisible });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const inviteMembersHandler = async (req, res) => {
  const { groupId, users } = req.body;
  console.log({ groupId, users });

  const result = await inviteMembers(groupId, users);
  if (result.success) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(400).json({ message: result.message });
  }
};

const getQuizzesByGroup = async (req, res) => {
  const { groupId, search, sort, date, count, lastVisible } = req.query;

  const result = await getQuizzesByGroupId(
    groupId,
    req.user.uid,
    count,
    lastVisible,
    { sort, date, search }
  );
  if (result.success) {
    return res
      .status(200)
      .json({ cards: result.cards, lastVisible: result.lastVisible });
  } else {
    return res.status(400).json({ message: result.message });
  }
};

const getPassedQuizzesHandler = async (req, res) => {
  const { searchTerm, date, sort, count, lastVisible } = req.query;

  const result = await getPassedQuizzes(req.user.uid, count, lastVisible, {
    sort,
    searchTerm,
    date,
  });
  if (result.success) {
    return res
      .status(200)
      .json({ cards: result.cards, lastVisible: result.lastVisible });
  } else {
    return res.status(400).json({ message: result.message });
  }
};

const getDemandesByGroup = async (req, res) => {
  const { groupId, search, sort, date, count, lastVisible } = req.query;

  const result = await getDemandesByGroupId(groupId, count, lastVisible, {
    sort,
    date,
    search,
  });
  if (result.success) {
    return res
      .status(200)
      .json({ cards: result.cards, lastVisible: result.lastVisible });
  } else {
    return res.status(400).json({ message: result.message });
  }
};

const getMembersByGroup = async (req, res) => {
  const { search, count, lastVisible, groupId } = req.query;

  const result = await getMembers(
    search,
    groupId,
    req.user.uid,
    count,
    lastVisible
  );
  if (result.success) {
    return res
      .status(200)
      .json({ cards: result.cards, lastVisible: result.lastVisible });
  } else {
    return res.status(400).json({ message: result.message });
  }
};

module.exports = {
  getUserGroupsHandler,
  getQuizPlayDetailsHandler,
  getAvailableGroupsHandler,
  getDemandesByGroup,
  inviteMembersHandler,
  getMembersByGroup,
  getQuizzesByGroup,
  groupFragmentHandler,
  getPassedQuizzesHandler,
  getUsersHandler,
  getQuizzesHandler,
  patchGroupHandler,
  joinGroupHandler,
  createGroupHandler,
  transferRoleHandler,
  kickMemberHandler,
  leaveGroupHandler,
  removeGroupHandler,
};
