const { validationResult } = require("express-validator");
const ApiResponse = require("../utils/response");

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    return ApiResponse.validationError(res, formattedErrors);
  }

  next();
};

// Joi validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const formattedErrors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        error: "Validation failed",
        details: formattedErrors,
      });
    }

    req.body = value;
    next();
  };
};

module.exports = { validate, validateRequest };
