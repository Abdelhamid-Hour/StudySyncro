const { getExams } = require("../utils/firebase-utils/examen");
const {
  getJoinedGroups,
  getAvailableGroups,
  modifyGroup,
  createGroup,
  joinGroup,
  deleteGroup,
  quitterGroup,
  inviteMembers,
} = require("../utils/firebase-utils/group");
const {
  addMember,
  kickMember,
  getUsers,
} = require("../utils/firebase-utils/members");
const {
  getQuestions,
  getQuizDuration,
} = require("../utils/firebase-utils/question");
const { isQuizPassed } = require("../utils/firebase-utils/session");

const getUserGroupsHandler = async (req, res) => {
  const { lastVisible, count, level, visibility, searchTerm, sort, role } =
    req.query;
  console.log("Query Parameters:", req.query);

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
  const { searchTerm, sort, lastVisible, count } = req.query;
  const creteria = {
    searchTerm: searchTerm || "",
    sort: sort || "desc",
  };
  const data = await getExams(req.user.uid, creteria, count, lastVisible);
  return res.json(data);
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
  // const userid = req.user.uid;
  // const quizId = req.query.quizId;

  // const result = {
  //   success: true,
  //   quizData: {
  //     questions: [
  //       {
  //         id: 'q1',
  //         text: 'What is the capital of Morocco?',
  //         choices: ['Casablanca', 'Marrakesh', 'Fez', 'Rabat'],
  //         correctAnswerIndex: 3, // Rabat
  //       },
  //       {
  //         id: 'q2',
  //         text: 'How many planets are there in the solar system?',
  //         choices: ['7', '8', '9', '10'],
  //         correctAnswerIndex: 1, // 8
  //       },
  //       {
  //         id: 'q3',
  //         text: 'What is the result of 9 × 6?',
  //         choices: ['54', '56', '59', '60'],
  //         correctAnswerIndex: 0, // 54
  //       },
  //       {
  //         id: 'q4',
  //         text: 'Who invented the electric light bulb?',
  //         choices: ['Einstein', 'Edison', 'Newton', 'Beethoven'],
  //         correctAnswerIndex: 1, // Edison
  //       },
  //       {
  //         id: 'q5',
  //         text: 'What is 100 minus 47?',
  //         choices: ['52', '53', '54', '55'],
  //         correctAnswerIndex: 1, // 53
  //       },
  //       {
  //         id: 'q6',
  //         text: 'Which of these animals cannot fly?',
  //         choices: ['Eagle', 'Ostrich', 'Bat', 'Pigeon'],
  //         correctAnswerIndex: 1, // Ostrich
  //       },
  //       {
  //         id: 'q7',
  //         text: 'How many minutes are there in one hour?',
  //         choices: ['60', '100', '45', '90'],
  //         correctAnswerIndex: 0, // 60
  //       },
  //       {
  //         id: 'q8',
  //         text: 'What is the sum of 11 and 22?',
  //         choices: ['31', '32', '33', '34'],
  //         correctAnswerIndex: 2, // 33
  //       },
  //       {
  //         id: 'q9',
  //         text: 'What is the official language of Morocco?',
  //         choices: ['French', 'Tamazight', 'Arabic', 'English'],
  //         correctAnswerIndex: 2, // Arabic
  //       },
  //       {
  //         id: 'q10',
  //         text: 'Which continent is Egypt located in?',
  //         choices: ['Asia', 'Europe', 'Africa', 'South America'],
  //         correctAnswerIndex: 2, // Africa
  //       },
  //     ],
  //     id: 'vghtyiTYivuyRXtiYUvTYX',
  //     duration: 20, // Duration in minutes
  //   },
  // };

  // if (result.success) {
  //   return res.status(200).json({ ...result.quizData });
  // } else {
  //   return res.status(400).json({
  //     message: result.message,
  //   });
  // }
  const userId = req.user.uid;
  const quizId = req.params.quizId;

  const questions = await getQuestions(quizId, userId);
  const duration = await getQuizDuration(req.user, quizId);
  const passed = await isQuizPassed(userId, quizId);

  console.log({ questions, duration, passed });

  if (questions) {
    return res.status(200).json({ questions, duration, passed });
  } else {
    return res.status(400).json({
      message: "Failed to load quiz questions. Please try again later.",
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
  console.log(req.body, "req body for join group");
  const groupId = req.body.groupId;

  const result = await joinGroup(groupId, req.user);
  console.log(result, "this is the result");
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

const addMemberHandler = async (req, res) => {
  const { memberId, groupId } = req.body; // !! check the userId
  const result = await addMember(groupId, memberId);
  // TODO: Implement addMembers logic

  if (result.success) {
    return res.status(200).json({ message: result.message });
  } else {
    return res.status(400).json({ message: result.message });
  }
};

const leaveGroupHandler = async (req, res) => {
  const { groupId } = req.body;
  const result = await quitterGroup(groupId, req.user.uid);

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
    const { search, count, lastVisible } = req.query;
    const result = await getUsers(search, count, lastVisible);
    console.log("result: ", result);

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

module.exports = {
  getUserGroupsHandler,
  getQuizPlayDetailsHandler,
  getAvailableGroupsHandler,
  inviteMembersHandler,
  groupFragmentHandler,
  getUsersHandler,
  getQuizzesHandler,
  patchGroupHandler,
  joinGroupHandler,
  createGroupHandler,
  transferRoleHandler,
  kickMemberHandler,
  addMemberHandler,
  leaveGroupHandler,
  removeGroupHandler,
};
