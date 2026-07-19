const { Quiz, millisecondsToHMFormat } = require("../utils/global");

const sendSessionDetails = (req, res) => {
  const sessionResult = res.sessionResult;

  if (!sessionResult.success) {
    return res.status(500).json({
      success: false,
      message: sessionResult.message || "Failed to fetch session details",
      isNative: sessionResult.isNative ?? false,
      type: sessionResult.type ?? "error",
    });
  }

  return res.render(
    "fragments/session-view",
    { session: {
      ...sessionResult.session,
      millisecondsToHMFormat
    }, Quiz },
    (err, html) => {
      if (err) {
        console.error("Error rendering session view:", err);
        return res.status(500).json({ message: "Internal Server Error", isNative: false, type: "error" });
      }
      return res.json({ overlay: html });
    }
  );
};

module.exports = {
  sendSessionDetails,
};
