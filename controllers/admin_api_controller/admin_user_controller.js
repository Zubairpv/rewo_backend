import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
  createAdmin,
  getAdminByUserName,
  updateAdminPassword,
} from "../../models/admin_models/adminModel.js";
import { sendResetEmail } from "../../services/email_service.js";

dotenv.config();

export const loginAdmin = async (req, res) => {
  try {
    const { user_name, password } = req.body;

    // Check if user exists
    const admin = await getAdminByUserName(user_name);
    if (!admin)
      return res
        .status(401)
        .json({ success: false, data: {}, message: "Invalid credentials" });

    // Verify password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, data: {}, message: "Invalid credentials" });

    // Generate JWT Token
    const token = jwt.sign(
      { id: admin.id, user_name: admin.user_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    const { password: _, ...adminWithoutPassword } = admin;
    res.json({
      success: true,
      data: { ...adminWithoutPassword, token },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ success: false, data: {}, message: "Internal server error" });
  }
};
export const createNewAdmin = async (req, res) => {
  try {
    const { user_name, password, name, created_by } = req.body;

    // Check if admin already exists
    const existingAdmin = await getAdminByUserName(user_name);
    if (existingAdmin) {
      return res
        .status(400)
        .json({ success: false, message: "Admin already exists" });
    }

    // Create new admin
    const hashedPassword = await bcrypt.hash(password, 10); // Hash password
    console.log(hashedPassword);
    const newAdmin = await createAdmin({
      user_name,
      hashedPassword,
      name,
      created_by,
    });

    return res.status(201).json({
      success: true,
      data: {
        ...newAdmin, // No password returned
      },
      message: "Admin registered successfully",
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY" || error.code === "23505") {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "User Id already exists. Please use a different number.",
        });
    }
    return res
      .status(500)
      .json({
        success: false,
        message: "Something went wrong",
        error: error.message,
      });
   
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { user_name, email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Generate a JWT token for password reset
    const resetToken = jwt.sign({ user_name }, process.env.JWT_SECRET, {
      expiresIn: "1h", // Token expires in 1 hour
    });

    // Send email with the token
    const emailSent = await sendResetEmail(email, resetToken);
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send reset email",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error processing request",
      error: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Hash the new password inside the controller
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log(hashedPassword);

    // Update the password in DB
    const result = await updateAdminPassword(decoded.user_name, hashedPassword);

    if (result === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
