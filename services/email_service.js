import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail", // Change to SMTP provider if needed
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset link/token
 */
export const sendResetEmail = async (email, resetToken) => {
  try {
    const mailOptions = {
      from: `"Rewo Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h3>Password Reset Request</h3>
        <p>You requested to reset your password. Click the link below:</p>
        <a href="https://yourapp.com/reset-password?token=${resetToken}">Reset Password</a>
        <p>If you did not request this, ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};
