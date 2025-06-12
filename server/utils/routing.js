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
  "/quizzes": ["/quizzes-groups", "/fields", "/forms"],
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
  let templateContext = {};
  const content = {
    greeting: "Hello",
  };
  switch (pathName) {
    case "/home":
      const payload = fetchHomeData();
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

    case pathNames.quizzes:
      const q = getExams(user.uid , {
        searchTerm  : "",
        sort : "desc"
      })
      templateContext = {
        cards: [
          {
            id: "quiz1",
            title: "Algebra Essentials",
            questionsCount: 12,
            sharedGroups: 3,
            sharedSessions: 7,
            subject: "Mathematics",
          },
          {
            id: "quiz2",
            title: "World Capitals Challenge",
            questionsCount: 10,
            sharedGroups: 2,
            sharedSessions: 5,
            subject: "Geography",
          },
          {
            id: "quiz3",
            title: "Physics Fundamentals",
            questionsCount: 15,
            sharedGroups: 4,
            sharedSessions: 8,
            subject: "Science",
          },
          {
            id: "quiz4",
            title: "Modern History",
            questionsCount: 9,
            sharedGroups: 2,
            sharedSessions: 3,
            subject: "History",
          },
          {
            id: "quiz5",
            title: "General Knowledge Mix",
            questionsCount: 20,
            sharedGroups: 5,
            sharedSessions: 10,
            subject: "General",
          },
          {
            id: "quiz6",
            title: "English Vocabulary",
            questionsCount: 14,
            sharedGroups: 3,
            sharedSessions: 6,
            subject: "English",
          },
          {
            id: "quiz7",
            title: "Chemistry Basics",
            questionsCount: 11,
            sharedGroups: 2,
            sharedSessions: 4,
            subject: "Science",
          },
          {
            id: "quiz8",
            title: "African Geography",
            questionsCount: 8,
            sharedGroups: 1,
            sharedSessions: 2,
            subject: "Geography",
          },
          {
            id: "quiz9",
            title: "Computer Science Intro",
            questionsCount: 13,
            sharedGroups: 3,
            sharedSessions: 7,
            subject: "Technology",
          },
          {
            id: "quiz10",
            title: "French Language Basics",
            questionsCount: 10,
            sharedGroups: 2,
            sharedSessions: 3,
            subject: "French",
          },
          {
            id: "quiz11",
            title: "Moroccan Culture",
            questionsCount: 7,
            sharedGroups: 2,
            sharedSessions: 2,
            subject: "Culture",
          },
          {
            id: "quiz12",
            title: "Environmental Science",
            questionsCount: 16,
            sharedGroups: 4,
            sharedSessions: 9,
            subject: "Science",
          },
          {
            id: "quiz13",
            title: "Art Movements",
            questionsCount: 9,
            sharedGroups: 2,
            sharedSessions: 4,
            subject: "Art",
          },
          {
            id: "quiz14",
            title: "Spanish Language Basics",
            questionsCount: 11,
            sharedGroups: 2,
            sharedSessions: 3,
            subject: "Spanish",
          },
          {
            id: "quiz15",
            title: "Programming Logic",
            questionsCount: 15,
            sharedGroups: 3,
            sharedSessions: 8,
            subject: "Technology",
          },
          {
            id: "quiz16",
            title: "World Religions",
            questionsCount: 10,
            sharedGroups: 2,
            sharedSessions: 5,
            subject: "Religion",
          },
          {
            id: "quiz17",
            title: "Business Basics",
            questionsCount: 12,
            sharedGroups: 3,
            sharedSessions: 6,
            subject: "Business",
          },
          {
            id: "quiz18",
            title: "Moroccan Geography",
            questionsCount: 8,
            sharedGroups: 1,
            sharedSessions: 2,
            subject: "Geography",
          },
          {
            id: "quiz19",
            title: "Music Theory",
            questionsCount: 13,
            sharedGroups: 2,
            sharedSessions: 4,
            subject: "Music",
          },
          {
            id: "quiz20",
            title: "Sports Trivia",
            questionsCount: 10,
            sharedGroups: 2,
            sharedSessions: 3,
            subject: "Sports",
          },
        ],
        lastVisible: 21,
      };
      return { templateContext };

    case pathNames.settings:
      // ! fetch data for settings frag
      content.greeting = "Hello To Your Settings";
      return { content };

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
