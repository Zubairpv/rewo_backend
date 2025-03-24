import jwt from "jsonwebtoken";
import SupplierModel from "../models/supplier_models/supplierModel.js";
import dotenv from "dotenv";
const authSupplier = async (req, res, next) => {
  const SECRET_KEY = process.env.JWT_SECRET; // Ensure you have this in your `.env` file
  try {
    // Get token from headers
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: No token provided" });
    }

    // Verify the token
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log(decoded);

    // Ensure the role is "supplier"
    if (decoded.role !== "supplier") {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Invalid role" });
    }

    // Find the supplier by ID and ensure the token is valid
    const supplier = await SupplierModel.findByIdOrJwt(decoded.id);

    if (!supplier) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Invalid token" });
    }

    // Attach supplier details to the request object
    req.supplier = supplier;
    next();
  } catch (error) {
    console.log(error);
    
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: Invalid token", error });
  }
};

export default authSupplier;
