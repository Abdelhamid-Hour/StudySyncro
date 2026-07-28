const { ZodError } = require("zod");

/**
 * Enterprise validation middleware that checks req.body, req.query, and req.params against Zod schemas.
 * Returns standardized JSON responses with root `message` and structured details when validation fails.
 */
const validate = (schemas) => async (req, res, next) => {
  console.log(" validate req : ", req.body, req.query, req.params);

  try {
    if (schemas.body) {
      req.body = await schemas.body.parseAsync(req.body);
    }
    if (schemas.query) {
      const parsedQuery = await schemas.query.parseAsync(req.query);
      req.query = parsedQuery;
    }
    if (schemas.params) {
      const parsedParams = await schemas.params.parseAsync(req.params);
      req.params = parsedParams;
    }
    next();
  } catch (err) {
    // log the fielde or the data name that made the problem :
    console.log("data name: ", err);

    if (err instanceof ZodError || err?.issues || err?.errors) {
      const issuesList = err.issues || err.errors || [];
      const details = Array.isArray(issuesList)
        ? issuesList.map((e) => ({
            field: Array.isArray(e?.path)
              ? e.path.join(".")
              : String(e?.path || ""),
            message: e?.message || "Invalid value",
            code: e?.code || "invalid_input",
          }))
        : [
            {
              field: "",
              message: err?.message || "Request validation failed.",
              code: "VALIDATION_ERROR",
            },
          ];

      const rootMessage = details[0]?.message || "Request validation failed.";
      console.log("rootMessage: ", rootMessage);

      return res.status(400).json({
        success: false,
        status: 400,
        message: rootMessage,
        isNative: true,
        type: "warning",
        error: {
          code: "VALIDATION_ERROR",
          message: rootMessage,
          details: details,
        },
      });
    }
    next(err);
  }
};

module.exports = { validate };
