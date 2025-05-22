const { getUserGroups, getAvailableGroups } = require("../utils/groups");

const getUserGroupsHandler = (req, res) => {
  const { nextLastId, count } = req.query;
  const data = getUserGroups(nextLastId, parseInt(count));
  return res.json(data);
};

const getAvailableGroupsHandler = (req, res) => {
  const { nextLastId, count } = req.query;
  const data = getAvailableGroups(nextLastId, parseInt(count));
  return res.json(data);
};

const groupFragmentHandler =
  ({ route, title }) =>
  (req, res) => {
    res.render(
      `fragments/my-groups${route}`,
      {
        ...res.context,
      },
      (err, template) => {
        if (err) {
          console.error('Error rendering template:', err);
          return res.status(500).json({
            message: 'Failed to load group info. Please try again later.',
          });
        }

        const response = { template, title };
        if (res.context.count) {
          response.count = res.context.count;
        }

        if (route === '/group-info') {
          response.info = {
            ...res.context,
          };
        }

        res.json(response);
      }
    );
  };

module.exports = {
  getUserGroupsHandler,
  getAvailableGroupsHandler,
  groupFragmentHandler,
};
