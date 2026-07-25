const { getDemandesByGroupId } = require("../utils/firebase-utils/demandes");
const {
  getUserQuizzes,
  getQuizzesByGroupId,
  getPassedQuizzes,
  getQuizPlayDetails,
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
  rejectInvite,
  updateGroupProperty,
} = require("../utils/firebase-utils/group");
const {
  kickMember,
  getUsers,
  getMembers,
} = require("../utils/firebase-utils/members");

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
    lastVisible,
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

  console.log("joinableOnly: ", joinableOnly);
  
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
    lastVisible,
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
    lastVisible,
  );

  if (result.success) {
    return res
      .status(200)
      .json({ cards: result.cards, lastVisible: result.lastVisible });
  }

  return res.status(400).json({
    message: res.locals.t(result.message),
    isNative: result.isNative ?? false,
    type: result.type ?? "error",
  });
};

const groupFragmentHandler =
  ({ route, title }) =>
  (req, res) => {
    if (!res.payload.success)
      return res.status(400).json({
        message: res.locals.t(res.payload.message) || "Failed to load.",
        isNative: res.payload.isNative ?? false,
        type: res.payload.type ?? "error",
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
            message: res.locals.t("api:failed_to_load_group_info_please_try_again_later"),
            isNative: false,
            type: "error",
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
      },
    );
  };

const getQuizPlayDetailsHandler = async (req, res) => {
  try {
    const result = await getQuizPlayDetails(req.user, req.params.quizId);
    if (result.success) return res.status(200).json({ ...result.data });
    return res.status(500).json({
      message: res.locals.t(result.message) || "Internal Server Error",
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  } catch (error) {
    console.log("Error in getQuizPlayDetailsHandler:");
    return res.status(500).json({ message: res.locals.t("api:internal_server_error"), isNative: false, type: "error" });
  }
};

const createGroupHandler = async (req, res) => {
  const formData = req.body.groupData;
  const userData = req.user;
  const result = await createGroup(formData, userData);
  if (result.success) {
    return res.status(200).json({ message: res.locals.t(result.message) });
  } else {
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
};

const joinGroupHandler = async (req, res) => {
  const groupId = req.body.groupId;
  const isInvite = Boolean(req.body.isInvite);

  const result = await joinGroup(groupId, req.user, isInvite);

  if (result.success) {
    return res.status(200).json({ status: result.status });
  }
  return res.status(400).json({
    message: res.locals.t(result.message),
    isNative: result.isNative ?? false,
    type: result.type ?? "error",
  });
};

const patchGroupHandler = async (req, res) => {
  const updatedData = req.body.updatedData;

  const userData = req.user;

  const result = await modifyGroup(
    userData.uid,
    req.params.groupId,
    updatedData,
  );

  if (result.success) {
    return res.status(200).json({ message: res.locals.t(result.message) });
  } else {
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
};

const transferRoleHandler = async (req, res) => {
  const { groupId, memberId } = req.body;
  const result = await updateGroupProperty(groupId, "creator", memberId);
  // TODO: Implement transferRole logic

  if (result.success) {
    return res.status(200).json({ message: res.locals.t(result.message) });
  } else {
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
};

const kickMemberHandler = async (req, res) => {
  const { groupId, memberId } = req.body;
  const result = await kickMember(groupId, memberId);
  // TODO: Implement kickMember logic

  if (result.success) {
    return res.status(200).json({ message: res.locals.t(result.message) });
  } else {
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
};

const leaveGroupHandler = async (req, res) => {
  const { groupId } = req.body;
  const result = await leaveGroup(groupId, req.user.uid);

  if (result.success) {
    return res.status(200).json({ message: res.locals.t(result.message) });
  } else {
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
};

const removeGroupHandler = async (req, res) => {
  const { groupId } = req.params;
  const result = await deleteGroup(groupId);
  if (result.success) {
    return res.status(200).json({ message: res.locals.t(result.message) });
  } else {
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
};

const getUsersHandler = async (req, res) => {
  try {
    const { search = '', count, lastVisible = '', groupId } = req.query;
    const result = await getUsers(search, count, lastVisible, groupId);

    if (result.success) {
      res.json({ cards: result.users, lastVisible: result.lastVisible });
    } else {
      res.status(400).json({
        message: res.locals.t(result.message),
        isNative: result.isNative ?? false,
        type: result.type ?? "error",
      });
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: res.locals.t("api:internal_server_error"), error: res.locals.t("api:internal_server_error"), isNative: false, type: "error" });
  }
};

const inviteMembersHandler = async (req, res) => {
  const { groupId, users } = req.body;

  const result = await inviteMembers(groupId, users, req.user);
  if (result.success) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
};

const getQuizzesByGroup = async (req, res) => {
  const { groupId, search, sort, date, count, lastVisible } = req.query;

  const result = await getQuizzesByGroupId(
    groupId,
    req.user.uid,
    count,
    lastVisible,
    { sort, date, search },
  );
  if (result.success) {
    return res
      .status(200)
      .json({ cards: result.cards, lastVisible: result.lastVisible });
  } else {
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
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
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
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
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
};

const getMembersByGroup = async (req, res) => {
  const { search, count, lastVisible, groupId } = req.query;

  const result = await getMembers(
    search,
    groupId,
    req.user.uid,
    count,
    lastVisible,
  );
  if (result.success) {
    return res
      .status(200)
      .json({ cards: result.cards, lastVisible: result.lastVisible });
  } else {
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
};

const rejectInviteHandler = async (req, res) => {
  const { groupId } = req.body;
  if (!groupId) {
    return res.status(400).json({ message: res.locals.t("api:group_id_is_required"), isNative: true, type: "warning" });
  }
  const result = await rejectInvite(groupId, req.user.uid);
  if (result.success) {
    return res.status(200).json({ message: res.locals.t(result.message) });
  } else {
    return res.status(400).json({
      message: res.locals.t(result.message),
      isNative: result.isNative ?? false,
      type: result.type ?? "error",
    });
  }
};

module.exports = {
  getUserGroupsHandler,
  getQuizPlayDetailsHandler,
  getAvailableGroupsHandler,
  getDemandesByGroup,
  inviteMembersHandler,
  rejectInviteHandler,
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
