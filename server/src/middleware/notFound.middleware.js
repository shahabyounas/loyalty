const ApiResponse = require("../utils/response");

const notFoundHandler = (req, res) => {
  return ApiResponse.notFound(res, `Route ${req.originalUrl} not found`);
};

module.exports = { notFoundHandler };
