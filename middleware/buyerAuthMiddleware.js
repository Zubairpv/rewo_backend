import jwt from "jsonwebtoken";

import Buyer from "../models/buyer_models/buyerModel.js";
import { body, validationResult } from "express-validator";

/**
 * 📌 Middleware to validate JWT Token for Buyer
 * Ensures the token is valid and matches the one stored in the database
 */
export async function validateBuyerToken(req, res, next) {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Unauthorized",
        error: "No token provided",
      });
    }

    // Decode JWT Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch Buyer Using ID (Not Contact Number)
    const buyer = await Buyer.getBuyerByContact(decoded.contact_number,true);

    // Debugging (Remove Later)
    console.log("Decoded Token:", decoded);
    console.log("Buyer from DB:", buyer);

    if (!buyer) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Buyer not found",
        error: "Invalid token",
      });
    }
    console.log(buyer.jwt_token, token);

    // Ensure token matches database (prevents reuse of old tokens)
    if (buyer.jwt_token !== token) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Invalid token",
        error: "Token mismatch",
      });
    }
    req.buyer = buyer; // ✅ Attach buyer data to request
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      data: null,
      message: "Invalid or expired token",
      error: error.message,
    });
  }
}

// 📌 Middleware to validate buyer registration
export const validateRegister = [
  body("name").trim().notEmpty().withMessage("Name is required"),

  body("contact_number")
    .trim()
    .notEmpty()
    .withMessage("Contact number is required")
    .bail() // Stop further checks if empty
    .isMobilePhone()
    .withMessage("Invalid contact number"),

  body("company_name")
    .trim()
    .notEmpty()
    .withMessage("Company name is required"),

  body("latitude")
    .notEmpty()
    .withMessage("Latitude is required")
    .bail()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),

  body("longitude")
    .notEmpty()
    .withMessage("Longitude is required")
    .bail()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),

  body("address").trim().notEmpty().withMessage("Address is required"),

  body("gst_number").optional().isString().withMessage("Invalid GST number"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Collect unique error messages
      const errorMessages = [...new Set(errors.array().map((err) => err.msg))];

      return res.status(400).json({
        success: false,
        data: null,
        message: errorMessages.join(", "), // Convert errors into a single string
        error: null,
      });
    }
    next();
  },
];

/**
 * 📌 Middleware to validate Buyer Login Data
 */
export const validateLogin = [
  body("contact_number")
    .trim()
    .notEmpty()
    .withMessage("Contact number is required")
    .isMobilePhone()
    .withMessage("Invalid contact number"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = [...new Set(errors.array().map((err) => err.msg))];

      return res.status(400).json({
        success: false,
        data: null,
        message: "Validation failed",
        error: errorMessages.join(","),
      });
    }
    next();
  },
];
