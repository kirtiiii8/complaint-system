const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendSuccess, sendError, asyncHandler } = require("../utils/apiResponse");

const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || "refreshsecret", { expiresIn: "7d" });
};

exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return sendError(res, "Name, email and password are required", 400);
  }
  if (password.length < 6) {
    return sendError(res, "Password must be at least 6 characters", 400);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, "Email already registered", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password: hashedPassword });

  sendSuccess(res, "User registered successfully", {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  }, 201);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, "Email and password are required", 400);
  }

  const user = await User.findOne({ email });
  if (!user) return sendError(res, "Invalid email or password", 401);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return sendError(res, "Invalid email or password", 401);

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  sendSuccess(res, "Login successful", {
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return sendError(res, "Refresh token required", 401);

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "refreshsecret");
  const user = await User.findById(decoded.userId);

  if (!user || user.refreshToken !== refreshToken) {
    return sendError(res, "Invalid refresh token", 401);
  }

  const newAccessToken = generateAccessToken(user._id, user.role);
  sendSuccess(res, "Token refreshed", { accessToken: newAccessToken });
});

exports.logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (user) {
    user.refreshToken = null;
    await user.save();
  }
  sendSuccess(res, "Logged out successfully");
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select("-password -refreshToken");
  if (!user) return sendError(res, "User not found", 404);
  sendSuccess(res, "Profile fetched", user);
});