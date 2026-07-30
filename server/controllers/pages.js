const {
  getQuizzPlayContext,
  getQuizEditContext,
} = require("../utils/firebase-utils/examen");
const { formatNumber } = require("../utils/global");
const { getGroupChatContext } = require("../utils/groups");
const { fetchData, renderFragmentOrLayout } = require("../utils/routing");

const errorPageIconClasses = {
  notFound: "bi bi-exclamation-triangle",
  serverError: "bi bi-x-circle",
  forbidden: "bi bi-exclamation-triangle",
};

const getErrorPageContext = (page, statusCode, t, descKey) => {
  const iconClass =
    statusCode === 500
      ? errorPageIconClasses.serverError
      : statusCode === 404
        ? errorPageIconClasses.notFound
        : errorPageIconClasses.forbidden;

  const description = descKey
    ? t(descKey)
    : statusCode === 404
      ? t("common:errors.page_not_found_desc", { page })
      : statusCode === 500
        ? t("common:errors.server_error_desc", { page })
        : t("common:errors.forbidden_desc", { page });

  const statusMessage =
    statusCode === 404
      ? t("common:errors.page_not_found")
      : statusCode === 500
        ? t("common:errors.server_error")
        : t("common:errors.forbidden");

  return {
    iconClass,
    description,
    statusMessage,
    statusCode,
  };
};

const handleRoutes = async (req, res) => {
  try {
    const payload = await fetchData(req.path, req.user, res.locals.t);
    const pathName = req.path === "/home" ? payload.pathName : req.path;

    const template = `templates${
      pathName === "/home"
        ? payload.pathName
        : pathName === "/quizzes"
          ? "/quizzes/quizzes-list"
          : pathName
    }`;

    return renderFragmentOrLayout(
      template,
      req.path === "/home" ? payload.payload : payload,
      pathName,
      req,
      res,
    );
  } catch (error) {
    console.error("Error in handleRoutes:", error);
    const t = res.locals.t;
    return renderFragmentOrLayout(
      "templates/error",
      {
        templateContext: {
          user: req.user,
          statusCode: 500,
          statusMessage: t ? t("common:errors.server_error") : "Server Error",
          description: t ? t("common:errors.server_error_desc_generic") : "An error occurred while rendering the page.",
          iconClass: "bi bi-x-circle",
          isStandalone: !req.path.startsWith("/app")
        },
      },
      "/error",
      req,
      res,
    );
  }
};

const handleGroupChatRoute = async (req, res) => {
  try {
    const result = await getGroupChatContext(req.user.uid, req.params.groupId); // Replace with actual logic to get group chat context

    if (!result.success) {
      return renderFragmentOrLayout(
        "templates/error",
        {
          templateContext: {
            ...getErrorPageContext(
              "group chat",
              result.statusCode,
              res.locals.t,
              result.message,
            ),
            user: true,
          },
        },
        "/error",
        req,
        res,
      );
    }

    const templateContext = result.templateContext;

    const extraData = {
      groupName: templateContext.groupName,
    };
    const payload = {
      templateContext,
      extraData: extraData,
    };

    renderFragmentOrLayout(
      "templates/groups/group-chat",
      payload,
      "/groups/my/group-chat",
      req,
      res,
    );
  } catch (error) {
    console.error("Error in handleGroupChatRoute:", error);
    const t = res.locals.t;
    return renderFragmentOrLayout(
      "templates/error",
      {
        templateContext: {
          user: req.user,
          statusCode: 500,
          statusMessage: t ? t("common:errors.server_error") : "Server Error",
          description: t ? t("common:errors.server_error_desc_generic") : "An error occurred while rendering the page.",
          iconClass: "bi bi-x-circle",
          isStandalone: !req.path.startsWith("/app")
        },
      },
      "/error",
      req,
      res,
    );
  }
};

const handleQuizEditRoute = async (req, res) => {
  try {
    const quizId = req.params.quizId;

    const result = await getQuizEditContext(quizId, req.user.uid);

    if (!result.success) {
      return renderFragmentOrLayout(
        "templates/error",
        {
          templateContext: {
            ...getErrorPageContext(
              "quiz",
              result.statusCode,
              res.locals.t,
              result.message,
            ),
            user: true,
          },
        },
        "/error",
        req,
        res,
      );
    }

    const templateContext = { ...result.templateContext, formatNumber };

    const extraData = {
      quizTitle: templateContext.title,
    };
    const payload = {
      templateContext,
      extraData: extraData,
    };

    renderFragmentOrLayout(
      "templates/quizzes/quiz-editor",
      payload,
      "/quizzes/my/quiz-editor",
      req,
      res,
    );
  } catch (error) {
    console.error("Error in handleQuizEditRoute:", error);
    const t = res.locals.t;
    return renderFragmentOrLayout(
      "templates/error",
      {
        templateContext: {
          user: req.user,
          statusCode: 500,
          statusMessage: t ? t("common:errors.server_error") : "Server Error",
          description: t ? t("common:errors.server_error_desc_generic") : "An error occurred while rendering the page.",
          iconClass: "bi bi-x-circle",
          isStandalone: !req.path.startsWith("/app")
        },
      },
      "/error",
      req,
      res,
    );
  }
};

const handleQuizPlayRoute = async (req, res) => {
  try {
    const response = await getQuizzPlayContext(
      req.user,
      req.params.quizId,
      req.query.groupId,
    );

    const templateContext = response.templateContext;

    const payload = {
      templateContext,
    };

    if (!response.success) {
      return renderFragmentOrLayout(
        "templates/error",
        {
          templateContext: {
            ...getErrorPageContext(
              "quiz",
              response.statusCode,
              res.locals.t,
              response.message,
            ),
            user: true,
          },
        },
        "/error",
        req,
        res,
      );
    }

    renderFragmentOrLayout(
      "templates/quiz-play",
      payload,
      "/quiz-play",
      req,
      res,
    );
  } catch (error) {
    console.error("Error in handleQuizPlayRoute:", error);
    const t = req.t || (res.locals && res.locals.t);
    return renderFragmentOrLayout(
      "templates/error",
      {
        templateContext: {
          user: req.user,
          statusCode: 500,
          statusMessage: t ? t("common:errors.server_error") : "Server Error",
          description: t ? t("common:errors.server_error_desc_generic") : "An error occurred while rendering the page.",
          iconClass: "bi bi-x-circle",
          isStandalone: !req.path.startsWith("/app")
        },
      },
      "/error",
      req,
      res,
    );
  }
};

const pageNotFoundHandler = async (req, res) => {
  const t = res.locals.t;
  const templateContext = {
    isStandalone: false,
    user: req.user,
    statusCode: 404,
    statusMessage: t("common:errors.page_not_found"),
    description: t("common:errors.page_not_found_desc_generic"),
    iconClass: "bi bi-exclamation-triangle",
  };

  if (req.path.startsWith("/app") && req.user) {
    return renderFragmentOrLayout(
      "templates/error",
      {
        templateContext: {
          ...templateContext,
          isStandalone: false,
        },
      },
      "/error",
      req,
      res,
    );
  }

  return res.status(404).render("templates/error", {
    ...templateContext,
    isStandalone: true,
  });
};

module.exports = {
  handleRoutes,
  handleGroupChatRoute,
  handleQuizEditRoute,
  handleQuizPlayRoute,
  pageNotFoundHandler,
};
