const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");
const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/", protect, upload.array("attachments", 3), complaintController.createComplaint);
router.get("/my", protect, complaintController.getMyComplaints);
router.delete("/:id", protect, complaintController.deleteComplaint);

router.get("/stats", protect, isAdmin, complaintController.getStats);
router.get("/all", protect, isAdmin, complaintController.getAllComplaints);
router.patch("/:id/status", protect, isAdmin, complaintController.updateComplaintStatus);

module.exports = router;