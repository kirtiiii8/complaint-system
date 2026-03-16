const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendStatusEmail = async (toEmail, userName, complaintTitle, newStatus) => {
  const statusColors = {
    "Pending": "#f59e0b",
    "In Progress": "#3b82f6",
    "Resolved": "#10b981",
    "Rejected": "#ef4444"
  };
  const color = statusColors[newStatus] || "#6b7280";

  const mailOptions = {
    from: `"Complaint System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your complaint status updated to "${newStatus}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Complaint Status Update</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Your complaint <strong>"${complaintTitle}"</strong> has been updated.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;">New Status: 
            <span style="background: ${color}; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold;">
              ${newStatus}
            </span>
          </p>
        </div>
        <p>Login to your account to view more details.</p>
        <p style="color: #6b7280; font-size: 12px;">This is an automated message, please do not reply.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};