const { pathNames } = require('./global');
const {
  getUserGroups,
  getAvailableGroups,
  INITIALE_LOADERS_COUNT,
} = require('./groups');
const { fetchHomeData } = require('./home');

const SHARED_STYLES_MAP = {
  '/home/inactive': ['/tasks'],
  '/home/active': ['/tasks', '/chat', '/quiz-result'],
  '/quizzes': ['/quizzes-groups', '/fields', '/forms'],
  '/groups/my': [
    '/groups-my-available',
    '/quizzes-groups',
    '/fields',
    '/tasks',
    '/forms',
  ],
  '/groups/my/group-chat': [
    '/chat',
    '/tasks',
    '/fields',
    '/forms',
    '/quiz-result',
  ],
  '/groups/available': ['/groups-my-available', '/quizzes-groups'],
  '/quiz-play': ['/quiz-result'],
  '/settings': ['/fields'],
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
  const type = href.split('.')[1] === 'css' ? 'style' : 'script';
  const preloadLink = `<link rel="${
    type === 'style' ? 'preload' : 'modulepreload'
  }" href="${href}" as="${type}" data-dynamic="" ${
    type === 'script' ? 'crossorigin="anonymous"' : ''
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

const fetchData = (pathName) => {
  const content = {
    greeting: 'Hello',
  };
  switch (pathName) {
    case '/home':
      return fetchHomeData();

    case pathNames.groups.my:
      // ! fetch data for my groups frag'
      return { ...getUserGroups('', INITIALE_LOADERS_COUNT) };

    case pathNames.groups.available:
      // ! fetch data for available groups frag
      return { ...getAvailableGroups('', INITIALE_LOADERS_COUNT) };

    case pathNames.quizzes:
      // ! fetch data for quizzes frag
      content.greeting = 'Hello To Your Quizzes';
      return { content };

    case pathNames.settings:
      // ! fetch data for settings frag
      content.greeting = 'Hello To Your Settings';
      return { content };

    default:
      throw new Error('Invalide Template');
  }
};

const renderFragmentOrLayout = (
  template,
  templateContext,
  pathName,
  req,
  res,
  extraProps
) => {
  const isFetch = req.headers?.['x-requested-with'] === 'fetch'; // should I add it in front end

  return res.render(template, templateContext, (err, htmlFragment) => {
    if (err) {
      console.error('Error rendering template:', err);
      return res
        .status(500)
        .send('An error occurred while rendering the page.');
    }

    if (isFetch)
      return res
        .status(200)
        .json({ pathName: pathName, htmlFragment: htmlFragment });

    return res.render(
      'layout',
      {
        sharedStyles: setSharedStylesResources(pathName),
        resourcesRoute: `${pathName}/`,
        content: htmlFragment,
        user: req.user,
        ...extraProps,
      },
      (layoutErr, fullPage) => {
        if (layoutErr) {
          console.error('Error rendering layout:', layoutErr);
          return res
            .status(500)
            .send('An error occurred while rendering the layout.');
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
