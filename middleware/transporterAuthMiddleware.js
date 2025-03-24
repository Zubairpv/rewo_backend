import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import TransporterModel from "../models/transporter_models/transporterModel.js";

dotenv.config();

const authenticateTransporter = async (req, res, next) => {
  const SECRET_KEY = process.env.JWT_SECRET; // Ensure you have this in your `.env` file
  try {
    const token = req.header("Authorization")?.split(" ")[1]; // Extract Bearer token
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    console.log(decoded);

    const transporter = await TransporterModel.findByTokenOrNumber(token);
    console.log(transporter);

    if (!transporter && decoded.role != "transporter") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token." });
    }

    req.transporter = transporter; // Attach transporter data to request
    next();
  } catch (error) {
    console.log(error);

    return res
      .status(401)
      .json({ success: false, message: "Unauthorized access", error });
  }
};

export default authenticateTransporter;
