const { sendError } = require("../utils/apiResponse");

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return sendError(res, "Access denied. Admins only.", 403);
  }
  next();
};