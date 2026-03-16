exports.sendSuccess = (res, message, data = null, statusCode = 200, pagination = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  if (pagination) response.pagination = pagination;
  return res.status(statusCode).json(response);
};

exports.sendError = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ success: false, message });
};

exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};