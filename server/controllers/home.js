const { Quiz } = require("../utils/global");

const sendSessionDetails = (req, res) => {
  const session = res.session;

  return res.render(
    'fragments/session-view',
    { session, Quiz },
    (err, html) => {
      if (err) {
        console.error('Error rendering session view:', err);
        return res.status(500).send('Internal Server Error');
      }
      return res.json({ overlay: html });
    }
  );
};

module.exports = {
  sendSessionDetails,
};
