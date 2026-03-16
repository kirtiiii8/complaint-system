const Complaint = require("../models/Complaint");
const { sendSuccess, sendError, asyncHandler } = require("../utils/apiResponse");
const { sendStatusEmail } = require("../config/email");
const cloudinary = require("../config/cloudinary");

exports.createComplaint = asyncHandler(async (req, res) => {
  const { title, description, category } = req.body;

  if (!title || !description || !category) {
    return sendError(res, "Title, description and category are required", 400);
  }

  const validCategories = ["Billing", "Technical", "Service", "Delivery", "Other"];
  if (!validCategories.includes(category)) {
    return sendError(res, "Invalid category", 400);
  }

  const attachments = [];
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      attachments.push({
        url: file.path,
        public_id: file.filename,
        originalName: file.originalname,
        fileType: file.mimetype
      });
    });
  }

  const complaint = await Complaint.create({
    title,
    description,
    category,
    user: req.user.userId,
    attachments
  });

  sendSuccess(res, "Complaint submitted successfully", complaint, 201);
});

exports.getMyComplaints = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    category,
    search,
    sortBy = "createdAt",
    order = "desc"
  } = req.query;

  const filter = { user: req.user.userId, isDeleted: false };
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Complaint.countDocuments(filter);
  const sortOrder = order === "asc" ? 1 : -1;

  const complaints = await Complaint.find(filter)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(parseInt(limit));

  sendSuccess(res, "Complaints fetched", complaints, 200, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit))
  });
});

exports.getAllComplaints = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    category,
    search,
    sortBy = "createdAt",
    order = "desc"
  } = req.query;

  const filter = { isDeleted: false };
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Complaint.countDocuments(filter);
  const sortOrder = order === "asc" ? 1 : -1;

  const complaints = await Complaint.find(filter)
    .populate("user", "name email")
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(parseInt(limit));

  sendSuccess(res, "All complaints fetched", complaints, 200, {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit))
  });
});

exports.updateComplaintStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const validStatuses = ["Pending", "In Progress", "Resolved", "Rejected"];
  if (!status || !validStatuses.includes(status)) {
    return sendError(res, "Invalid status", 400);
  }

  const complaint = await Complaint.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).populate("user", "name email");

  if (!complaint) return sendError(res, "Complaint not found", 404);

  try {
    await sendStatusEmail(
      complaint.user.email,
      complaint.user.name,
      complaint.title,
      status
    );
  } catch (err) {
    console.log("Email failed:", err.message);
  }

  sendSuccess(res, "Status updated successfully", complaint);
});

exports.deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findOne({
    _id: req.params.id,
    user: req.user.userId,
    isDeleted: false
  });

  if (!complaint) return sendError(res, "Complaint not found", 404);

  if (complaint.attachments.length > 0) {
    for (const file of complaint.attachments) {
      await cloudinary.uploader.destroy(file.public_id);
    }
  }

  complaint.isDeleted = true;
  await complaint.save();

  sendSuccess(res, "Complaint deleted successfully");
});

exports.getStats = asyncHandler(async (req, res) => {
  const byStatus = await Complaint.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const byCategory = await Complaint.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: "$category", count: { $sum: 1 } } }
  ]);

  const total = await Complaint.countDocuments({ isDeleted: false });

  sendSuccess(res, "Stats fetched", { total, byStatus, byCategory });
});