const setGlobalUrls = (req, res, next) => {
  res.locals.baseUrl = req.protocol + "://" + req.get("host");
  res.locals.fullUrl = res.locals.baseUrl + req.originalUrl;
  next();
};

const redirectRoute = (redirectTarget) => (req, res) => res.redirect(redirectTarget);

const generateSitemap = (req, res) => {
  const baseUrl = req.protocol + "://" + req.get("host");
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

  res.header("Content-Type", "application/xml");
  res.send(sitemap);
};

const globalErrorHandler = (err, req, res, next) => {
  console.error("Unhandled Application Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  if (req.path.startsWith("/api")) {
    return res.status(500).json({
      success: false,
      isNative: false,
      message: "Internal Server Error",
    });
  }

  const t = (res.locals && res.locals.t) || ((k) => k);
  const isStandalone = !req.path.startsWith("/app");

  try {
    res.status(500).render("templates/error", {
      isStandalone,
      user: req.user,
      statusCode: 500,
      statusMessage: t("common:errors.server_error") || "Server Error",
      description:
        t("common:errors.server_error_desc_generic") ||
        "An unexpected error occurred.",
      iconClass: "bi bi-x-circle",
    });
  } catch (fallbackErr) {
    console.error("Failed to render error template:", fallbackErr);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  setGlobalUrls,
  redirectRoute,
  generateSitemap,
  globalErrorHandler
};
