const { body, validationResult } = require("express-validator");

exports.checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

exports.validateSignup = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
];

exports.validateLogin = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required")
];

exports.validateComplaint = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").trim().isLength({ min: 10 }).withMessage("Description must be at least 10 characters"),
  body("category")
    .isIn(["Billing", "Technical", "Service", "Delivery", "Other"])
    .withMessage("Category must be one of: Billing, Technical, Service, Delivery, Other")
];

exports.validateStatusUpdate = [
  body("status")
    .isIn(["Pending", "In Progress", "Resolved", "Rejected"])
    .withMessage("Status must be one of: Pending, In Progress, Resolved, Rejected")
];
