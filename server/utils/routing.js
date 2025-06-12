const { pathNames } = require("./global");
const {
  getUserGroups,
  INITIALE_LOADERS_COUNT,
  getAvailableGr,
} = require("./groups");
const {
  getJoinedGroups,
  getAvailableGroups,
} = require("./firebase-utils/group");
const { fetchHomeData } = require("./home");

const {} = require("./firebase-utils/group");
const { getExams } = require("./firebase-utils/examen");

const SHARED_STYLES_MAP = {
  "/home/inactive": ["/tasks"],
  "/home/active": ["/tasks", "/chat", "/quiz-result"],
  "/quizzes/my": ["/quizzes-groups", "/fields", "/forms", "/quizzes-my-groups"],
  "/quizzes/groups": [
    "/quizzes-groups",
    "/fields",
    "/forms",
    "quizzes-my-groups",
  ],
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
    const styles = sharedStyles;
    return styles.map((style) => {
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

const fetchData = async (pathName, user) => {
  console.log(`Fetching data for path: ${pathName} for user: ${user.uid}`);
  
  let templateContext = {};
  switch (pathName) {
    case "/home":
      const payload = fetchHomeData(user.uid);
      payload.payload.extraData = {
        fullName: user.fullName,
      };
      return payload;

    case pathNames.groups.my:
      templateContext = {
        ...(await getJoinedGroups(
          user.uid,
          {
            level: [],
            visibility: [],
            available: false,
            role: [],
            searchTerm: "",
            searchBy: "",
          },
          INITIALE_LOADERS_COUNT
        )),
        userId: user.uid,
      };

      return { templateContext };

    case pathNames.groups.available:
      templateContext = {
        ...(await getAvailableGroups(
          user.uid,
          {
            level: [],
            visibility: [],
            available: false,
            role: [],
            searchTerm: "",
            searchBy: "",
          },
          INITIALE_LOADERS_COUNT
        )),
        userId: user.uid,
      };

      return { templateContext };

    case pathNames.quizzes.my:
      templateContext = await getExams(user.uid, {
        searchTerm: "",
        sort: "desc",
      });

      return { templateContext };

    case pathNames.quizzes.groups:
      templateContext = await getExams(user.uid, {
        searchTerm: "",
        sort: "desc",
      });

      return { templateContext };

    case pathNames.settings:
      // ! fetch data for settings frag
      return {};

    default:
      throw new Error("Invalide Template");
  }
};

const renderFragmentOrLayout = (
  template,
  payload,
  pathName,
  req,
  res,
  extraProps
) => {
  const isFetch = req.headers?.["x-requested-with"] === "fetch"; // should I add it in front end

  return res.render(template, payload.templateContext, (err, htmlFragment) => {
    if (err) {
      console.error("Error rendering template:", err);
      return res
        .status(500)
        .send("An error occurred while rendering the page.");
    }

    if (isFetch)
      return res.status(200).json({
        pathName: pathName,
        htmlFragment: htmlFragment,
        extraData: payload.extraData,
      });
      console.log("Rendering full layout for path:", pathName);
      
    return res.render(
      "layout",
      {
        sharedStyles: setSharedStylesResources(pathName),
        resourcesRoute: `${pathName}/`,
        content: htmlFragment,
        user: req.user,
        ...extraProps,
      },
      (layoutErr, fullPage) => {
        if (layoutErr) {
          console.error("Error rendering layout:", layoutErr);
          return res
            .status(500)
            .send("An error occurred while rendering the layout.");
        }

        return res.status(200).send(fullPage);
      }
    );
  });
};

module.exports = {
  renderFragmentOrLayout,
  fetchData,
};
