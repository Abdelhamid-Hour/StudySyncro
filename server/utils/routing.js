const {
  pathNames,
  formatNumber,
  toReadableDate,
  getScoreClass,
} = require("./global");
const {
  getJoinedGroups,
  getAvailableGroups,
} = require("./firebase-utils/group");
const { fetchHomeData } = require("./home");

const {} = require("./firebase-utils/group");
const { getUserQuizzes, getPassedQuizzes } = require("./firebase-utils/examen");
const { INITIALE_LOADERS_COUNT } = require("./global");
const { getSettingsContext } = require("./firebase-utils/settings");
const { getUserNotifications } = require("./firebase-utils/notifications");

const SHARED_STYLES_MAP = {
  "/home/inactive": ["/tasks", "/chat"],
  "/home/active": ["/tasks", "/chat", "/quiz-result"],
  "/quizzes/my": ["/quizzes-groups", "/fields", "/forms"],
  "/quizzes/passed": ["/quizzes-groups", "/fields", "/forms", "/quiz-result"],
  "/groups/my": [
    "/groups-my-available",
    "/quizzes-groups",
    "/fields",
    "/tasks",
    "/forms",
  ],
  "/groups/my/group-chat": [
    "/chat",
    "/tasks",
    "/fields",
    "/forms",
    "/quiz-result",
  ],
  "/groups/available": ["/groups-my-available", "/quizzes-groups"],
  "/quiz-play": ["/quiz-result"],
  "/settings": ["/fields"],
};

const setSharedStylesResources = (pathName) => {
  const sharedStyles = SHARED_STYLES_MAP[pathName];

  if (sharedStyles) {
    return sharedStyles.map((style) => {
      return setStyleRoute(`/shared${style}`);
    });
  }
};

const createPreloadLink = (href) => {
  const type = href.split(".")[1] === "css" ? "style" : "script";
  const preloadLink = `<link rel="${
    type === "style" ? "preload" : "modulepreload"
  }" href="${href}" as="${type}" data-dynamic="" ${
    type === "script" ? 'crossorigin="anonymous"' : ""
  }>`;
  return preloadLink;
};

const setStyleRoute = (pathName) => {
  const href = `/app/assets${pathName}/css/styles.css`;
  const preloadLink = createPreloadLink(href);
  return {
    preloadLink,
    styleTag: `<link rel="stylesheet" href="${href}" as="style" data-dynamic="">`,
  };
};

const fetchData = async (pathName, user, t) => {
  let templateContext = {};
  switch (pathName) {
    case "/home":
      const payload = await fetchHomeData(user.uid, t);
      payload.payload.extraData = {
        fullName: user.fullName,
        hasActiveSession: payload.payload.hasActiveSession || false,
      };
      return payload;

    case pathNames.groups.my:
      templateContext = {
        ...(await getJoinedGroups(user.uid, {
          level: [],
          visibility: [],
          available: false,
          role: [],
          searchTerm: "",
          searchBy: "",
        })),
        userId: user.uid,
      };

      return { templateContext };

    case pathNames.groups.available:
      templateContext = {
        ...(await getAvailableGroups(user.uid, {
          level: [],
          visibility: [],
          available: false,
          role: [],
          searchTerm: "",
          searchBy: "",
        })),
        userId: user.uid,
      };

      return { templateContext };

    case pathNames.quizzes.my:
      templateContext = await getUserQuizzes(user.uid, {
        searchTerm: "",
        sort: "desc",
        status: [],
      });

      templateContext.formatNumber = formatNumber;

      return { templateContext };

    case pathNames.quizzes.passed:
      templateContext = await getPassedQuizzes(user.uid);

      templateContext.toReadableDate = toReadableDate;
      templateContext.getScoreClass = getScoreClass;

      return { templateContext };

    case pathNames.settings:
      templateContext = await getSettingsContext(user.uid);

      return { templateContext };

    default:
      throw new Error("Invalide Template");
  }
};

const renderFragmentOrLayout = (template, payload, pathName, req, res) => {
  const isFetch = req.headers?.["x-requested-with"] === "fetch"; // should I add it in front end

  res.setHeader("Vary", "X-Requested-With");
  res.setHeader("Cache-Control", "private, no-cache");

  return res.render(
    template,
    payload.templateContext,
    async (err, htmlFragment) => {
      if (err) {
        console.error("Error rendering template:", err);
        return res
          .status(500)
          .send("An error occurred while rendering the page.");
      }

      if (isFetch)
        return res.status(200).json({
          pathName,
          htmlFragment: htmlFragment,
          extraData: payload.extraData,
        });

      let notificationsData = {
        cards: [],
        count: 0,
        lastVisible: null,
        unreadCount: 0,
      };
      if (req.user && req.user.uid) {
        try {
          const notifRes = await getUserNotifications(
            req.user.uid,
            INITIALE_LOADERS_COUNT,
          );
          if (notifRes && notifRes.success) {
            notificationsData = notifRes;
          }
        } catch (e) {
          console.error("Error fetching initial notifications for layout:", e);
        }
      }

      return res.render(
        "layout",
        {
          sharedStyles: setSharedStylesResources(pathName),
          resourcesRoute: `${pathName}/`,
          content: htmlFragment,
          user: req.user,
          notificationsData,
          toReadableDate,
          ...payload.extraData,
        },
        (layoutErr, fullPage) => {
          if (layoutErr) {
            console.error("Error rendering layout:", layoutErr);
            return res
              .status(500)
              .send("An error occurred while rendering the layout.");
          }

          return res.status(200).send(fullPage);
        },
      );
    },
  );
};

module.exports = {
  renderFragmentOrLayout,
  fetchData,
};
